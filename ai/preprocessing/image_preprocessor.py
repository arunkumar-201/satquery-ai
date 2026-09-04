import os
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import rasterio
    from rasterio.warp import reproject, Resampling, calculate_default_transform
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False


class ImagePreprocessor:
    """Preprocessing pipeline for satellite imagery.
    Handles normalization, resizing, format conversion, and metadata extraction.
    """

    def __init__(self, max_dimension: int = 1024):
        self.max_dimension = max_dimension

    def load(self, path: str) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Load an image and return (array, metadata). Supports PNG, JPG, TIFF/GeoTIFF."""
        path = Path(path)
        metadata = {"path": str(path), "original_shape": None}

        if path.suffix.lower() in (".tif", ".tiff"):
            if RASTERIO_AVAILABLE:
                return self._load_geotiff(path)
            elif PIL_AVAILABLE:
                return self._load_with_pil(path)
        elif path.suffix.lower() in (".png", ".jpg", ".jpeg"):
            if PIL_AVAILABLE:
                return self._load_with_pil(path)

        raise ValueError(f"Unsupported image format: {path.suffix}")

    def _load_geotiff(self, path: Path) -> Tuple[np.ndarray, Dict[str, Any]]:
        with rasterio.open(path) as src:
            # Read all bands
            data = src.read()  # (bands, H, W)
            metadata = {
                "path": str(path),
                "original_shape": (src.height, src.width, src.count),
                "crs": str(src.crs) if src.crs else None,
                "bounds": src.bounds,
                "transform": src.transform,
                "count": src.count,
                "dtype": str(src.dtypes[0]),
            }

            # Rearrange to (H, W, C)
            if data.shape[0] == 1:
                img = data[0]  # (H, W)
                img = np.stack([img] * 3, axis=-1)  # Make it 3-channel for visualization
            elif data.shape[0] >= 3:
                # Use first 3 bands as RGB
                img = np.transpose(data[:3], (1, 2, 0))
            else:
                # Duplicate single band
                img = np.transpose(data, (1, 2, 0))
                img = np.repeat(img, 3, axis=-1)

            metadata["original_shape"] = img.shape
            return img, metadata

    def _load_with_pil(self, path: Path) -> Tuple[np.ndarray, Dict[str, Any]]:
        with PILImage.open(path) as img:
            img = img.convert("RGB")
            arr = np.array(img)
            metadata = {
                "path": str(path),
                "original_shape": arr.shape,
                "format": img.format,
                "mode": img.mode,
            }
            return arr, metadata

    def normalize(self, img: np.ndarray) -> np.ndarray:
        """Normalize image to 0-1 range."""
        if img.dtype != np.float32:
            img = img.astype(np.float32)

        # Simple min-max normalization per channel
        for c in range(img.shape[2]):
            channel = img[:, :, c]
            p2, p98 = np.percentile(channel, (2, 98))
            if p98 > p2:
                channel = np.clip((channel - p2) / (p98 - p2), 0, 1)
            img[:, :, c] = channel
        return img

    def resize(self, img: np.ndarray, max_dim: int = None) -> np.ndarray:
        """Resize image so max dimension <= max_dim, preserving aspect ratio."""
        max_dim = max_dim or self.max_dimension
        h, w = img.shape[:2]
        if max(h, w) <= max_dim:
            return img

        if h > w:
            new_h = max_dim
            new_w = int(w * max_dim / h)
        else:
            new_w = max_dim
            new_h = int(h * max_dim / w)

        if CV2_AVAILABLE:
            resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        elif PIL_AVAILABLE:
            pil_img = PILImage.fromarray((img * 255).astype(np.uint8))
            pil_img = pil_img.resize((new_w, new_h), PILImage.LANCZOS)
            resized = np.array(pil_img).astype(np.float32) / 255.0
        else:
            raise RuntimeError("Neither OpenCV nor PIL available for resizing")

        return resized

    def to_rgb_visualization(self, img: np.ndarray) -> np.ndarray:
        """Convert processed image to 8-bit RGB for display/saving."""
        if img.dtype != np.float32:
            img = img.astype(np.float32)

        # Ensure 0-1 range
        img = np.clip(img, 0, 1)
        return (img * 255).astype(np.uint8)

    def save_visualization(self, img: np.ndarray, output_path: str):
        """Save an RGB visualization image."""
        rgb = self.to_rgb_visualization(img)
        if PIL_AVAILABLE:
            PILImage.fromarray(rgb).save(output_path)
        elif CV2_AVAILABLE:
            cv2.imwrite(output_path, cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
        else:
            raise RuntimeError("No image saving library available")

    def basic_stats(self, img: np.ndarray) -> Dict[str, Any]:
        """Compute basic statistics for demo/fallback analysis."""
        stats = {
            "shape": img.shape,
            "dtype": str(img.dtype),
            "min": float(np.min(img)),
            "max": float(np.max(img)),
            "mean": float(np.mean(img)),
            "std": float(np.std(img)),
        }
        if img.shape[2] >= 3:
            stats["channel_means"] = [float(np.mean(img[:, :, c])) for c in range(min(3, img.shape[2]))]
            stats["channel_stds"] = [float(np.std(img[:, :, c])) for c in range(min(3, img.shape[2]))]
        return stats


def preprocess_image(path: str, max_dim: int = 1024) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Convenience function for single-image preprocessing."""
    preprocessor = ImagePreprocessor(max_dimension=max_dim)
    img, meta = preprocessor.load(path)
    img = preprocessor.normalize(img)
    img = preprocessor.resize(img)
    return img, meta


def compute_baseline_change(before_path: str, after_path: str, max_dim: int = 512) -> Dict[str, Any]:
    """Compute a baseline change detection using pixel difference.
    This is a simple fallback when no trained model is available.
    Clearly labeled as baseline/demo change detection."""
    preprocessor = ImagePreprocessor(max_dimension=max_dim)

    before_img, before_meta = preprocessor.load(before_path)
    after_img, after_meta = preprocessor.load(after_path)

    # Resize both to same size
    before_img = preprocessor.resize(before_img)
    after_img = preprocessor.resize(after_img)

    # Normalize
    before_img = preprocessor.normalize(before_img)
    after_img = preprocessor.normalize(after_img)

    # Ensure both are same shape
    if before_img.shape != after_img.shape:
        min_h = min(before_img.shape[0], after_img.shape[0])
        min_w = min(before_img.shape[1], after_img.shape[1])
        before_img = before_img[:min_h, :min_w]
        after_img = after_img[:min_h, :min_w]

    # Compute difference (L2 norm across channels)
    diff = np.sqrt(np.sum((after_img - before_img) ** 2, axis=2))

    # Threshold to find changed regions
    threshold = np.percentile(diff, 90)
    change_mask = (diff > threshold).astype(np.uint8) * 255

    # Find connected components (contours) for changed regions
    changed_regions = []
    if CV2_AVAILABLE:
        contours, _ = cv2.findContours(change_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            if cv2.contourArea(contour) > 50:  # Filter small noise
                x, y, w, h = cv2.boundingRect(contour)
                changed_regions.append({
                    "bbox": [int(x), int(y), int(x + w), int(y + h)],
                    "area": float(cv2.contourArea(contour)),
                    "centroid": [int(x + w / 2), int(y + h / 2)],
                })

    # Create change map visualization (red overlay on changed areas)
    change_map = np.zeros_like(before_img)
    change_map[:, :, 0] = change_mask  # Red channel
    change_map[:, :, 1] = 0
    change_map[:, :, 2] = 0

    return {
        "change_mask": change_mask,
        "change_map": change_map,
        "changed_regions": changed_regions,
        "mean_difference": float(np.mean(diff)),
        "max_difference": float(np.max(diff)),
        "changed_pixel_ratio": float(np.sum(change_mask > 0) / change_mask.size),
        "note": "Baseline Change Detection - Not a trained satellite foundation model",
    }