const fs = require('fs');
const path = require('path');
const { isKvEnabled, getFromKv, setToKv } = require('./_kv');

const getFilePath = () => {
  const fileName = 'bookings.json';
  const tmpPath = path.join('/tmp', fileName);
  const localPath = path.join(process.cwd(), fileName);
  
  if (!fs.existsSync(tmpPath)) {
    try {
      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, tmpPath);
      }
    } catch (e) {
      console.error('Error copying bookings file to /tmp:', e);
    }
  }
  
  return fs.existsSync(tmpPath) ? tmpPath : localPath;
};

module.exports = async (req, res) => {
  if (isKvEnabled()) {
    if (req.method === 'POST') {
      try {
        await setToKv('fitness_hub_bookings', []);
        return res.status(200).json({ status: 'success' });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }

  const filePath = getFilePath();
  
  if (req.method === 'POST') {
    try {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
