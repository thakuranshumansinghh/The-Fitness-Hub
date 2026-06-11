const fs = require('fs');
const path = require('path');

const getFilePath = () => {
  const fileName = 'data.json';
  const tmpPath = path.join('/tmp', fileName);
  const localPath = path.join(process.cwd(), fileName);
  
  // If running in serverless environment, copy from bundle to /tmp if not already present
  if (!fs.existsSync(tmpPath)) {
    try {
      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, tmpPath);
      }
    } catch (e) {
      console.error('Error copying data file to /tmp:', e);
    }
  }
  
  return fs.existsSync(tmpPath) ? tmpPath : localPath;
};

module.exports = (req, res) => {
  const filePath = getFilePath();
  
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(filePath)) {
        const defaultData = {
          heroTitle1: "FORGE YOUR LEGACY.",
          heroSubtitle1: "Premium equipment. Elite trainers. The ultimate fitness experience in Kurla, Mumbai.",
          heroTitle2: "BUILT ON RAW POWER.",
          heroSubtitle2: "Precision machinery and specialized platforms for max effort strength training.",
          heroTitle3: "JOIN THE FITNESS HUB.",
          heroSubtitle3: "Unleash your potential today. Book a session with our championship-grade coaching team.",
          aboutSubtitle: "We don't build gym memberships. We forge relentless athletic capability and physical fortitude.",
          aboutStory1: "Founded in Kurla, Mumbai, THE FITNESS HUB was established to bridge the gap between commercialized fitness franchises and hardcore strength athletics. We set out to create a sanctuary where physical potential is realized through raw science, top-tier infrastructure, and unyielding discipline.",
          aboutStory2: "Every bar, platform, and program at the Hub is curated for serious results. We offer a high-intensity, zero-compromise environment designed to push you past your boundaries.",
          galleryImages: [
            { "src": "assets/hero_bg.png", "caption": "MAIN STRENGTH ROOM" },
            { "src": "assets/crossfit.png", "caption": "METABOLIC CONDITIONING FLOOR" },
            { "src": "assets/bodybuilding.png", "caption": "FREE WEIGHT EQUIPMENT RACK" },
            { "src": "assets/gallery_1.png", "caption": "POWERLIFTING PLATFORM" },
            { "src": "assets/gallery_2.png", "caption": "CHAMPIONSHIP GRADE DUMBBELLS" },
            { "src": "assets/gallery_3.png", "caption": "PULL-UP RIG AND RIGGING AREA" }
          ]
        };
        return res.status(200).json(defaultData);
      }
      const fileData = fs.readFileSync(filePath, 'utf8');
      return res.status(200).json(JSON.parse(fileData));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const data = req.body;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
