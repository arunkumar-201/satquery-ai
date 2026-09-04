import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

// Create test image
const { createCanvas } = require('canvas');
const canvas = createCanvas(64, 64);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgb(40, 80, 120)';
ctx.fillRect(0, 0, 64, 64);
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('test.png', buffer);

const api = axios.create({
  baseURL: 'http://localhost:5173',
  withCredentials: false,
});

// Login
async function test() {
  try {
    const login = await api.post('/api/auth/login', {
      email: 'proxy-test@example.com',
      password: 'StrongPass123!'
    });
    console.log('Login:', login.status);
    const token = login.data.access_token;
    
    // Create project
    const project = await api.post('/api/projects', {
      name: 'FormData Test Project'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Project:', project.status);
    const project_id = project.data.id;
    
    // Upload with FormData
    const formData = new FormData();
    formData.append('project_id', project_id);
    formData.append('file', fs.createReadStream('test.png'), 'satellite.png');
    formData.append('modality', 'OPTICAL');
    formData.append('sensor', 'Sentinel-2');
    formData.append('acquisition_date', '30-08-2026');
    formData.append('latitude', '17.3850');
    formData.append('longitude', '78.4867');
    formData.append('resolution', '10');
    formData.append('bounding_box', '');
    
    const upload = await api.post('/api/images/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    console.log('Upload:', upload.status);
    console.log('Success:', upload.data);
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

test();
