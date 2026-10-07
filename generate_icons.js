const { execSync } = require('child_process');
const path = require('path');

const pyScript = `
from PIL import Image
import os

img_path = '${path.join(__dirname, 'extension', 'icons', 'logo.png')}'
if os.path.exists(img_path):
    img = Image.open(img_path)
    target_dir = '${path.join(__dirname, 'extension', 'icons')}'
    img.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(target_dir, 'icon-128.png'), 'PNG')
    img.resize((48, 48), Image.Resampling.LANCZOS).save(os.path.join(target_dir, 'icon-48.png'), 'PNG')
    img.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(target_dir, 'icon-16.png'), 'PNG')
    print('✅ Icons updated successfully!')
`;

try {
  execSync(`python3 -c "${pyScript}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('Error generating icons:', e);
}
