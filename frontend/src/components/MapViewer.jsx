import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapViewer({ images = [] }) {
  const points = images.filter(image => image.latitude != null && image.longitude != null)

  if (points.length === 0) {
    return <p className="text-center text-space-500 py-12">Geospatial coordinates are unavailable for these images.</p>
  }

  const center = [points[0].latitude, points[0].longitude]

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom className="h-[420px] w-full rounded-lg">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map(image => (
        <Marker key={image.id} position={[image.latitude, image.longitude]}>
          <Popup>{image.filename}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}