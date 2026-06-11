const fs = require('fs');
const path = require('path');

const getFilePath = () => {
  const fileName = 'bookings.json';
  const tmpPath = path.join('/tmp', fileName);
  const localPath = path.join(process.cwd(), fileName);
  
  if (!fs.existsSync(tmpPath)) {
    try {
      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, tmpPath);
      } else {
        fs.writeFileSync(tmpPath, '[]');
      }
    } catch (e) {
      console.error('Error copying bookings file to /tmp:', e);
    }
  }
  
  return fs.existsSync(tmpPath) ? tmpPath : localPath;
};

module.exports = (req, res) => {
  const filePath = getFilePath();
  
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(filePath)) {
        return res.status(200).json([]);
      }
      const fileData = fs.readFileSync(filePath, 'utf8');
      const data = fileData.trim() === "" ? [] : JSON.parse(fileData);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const newBooking = req.body;
      let bookings = [];
      
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        bookings = fileData.trim() === "" ? [] : JSON.parse(fileData);
      }
      
      bookings.push(newBooking);
      fs.writeFileSync(filePath, JSON.stringify(bookings, null, 2));
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
