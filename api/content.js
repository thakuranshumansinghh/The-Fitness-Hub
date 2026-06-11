const fs = require('fs');
const path = require('path');

const getFilePath = () => {
  const fileName = 'data.json';
  const tmpPath = path.join('/tmp', fileName);
  const localPath = path.join(process.cwd(), fileName);
  
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
          aboutHeading: "THE PHILOSOPHY",
          aboutPhoto: "assets/about_img.jpg",
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
          ],
          testimonials: [
            {
              "id": "1",
              "rating": 5,
              "quote": "Amazing atmosphere, top-quality equipment, and highly supportive trainers.",
              "authorName": "Anshuman S.",
              "authorTitle": "Verified Member",
              "avatar": "AS"
            },
            {
              "id": "2",
              "rating": 5,
              "quote": "Perfect place for both beginners and experienced people.",
              "authorName": "Rahul K.",
              "authorTitle": "Powerlifter",
              "avatar": "RK"
            },
            {
              "id": "3",
              "rating": 5,
              "quote": "Environment, proper and good condition machine.",
              "authorName": "Pratik D.",
              "authorTitle": "Bodybuilder",
              "avatar": "PD"
            }
          ],
          membershipPlans: [
            {
              "id": "1",
              "name": "BASIC STRENGTH",
              "price": "$49",
              "period": "MONTH",
              "features": [
                "Access to Strength Floor",
                "Standard Locker Room access",
                "1 Coach Consultation/mo"
              ],
              "ctaText": "JOIN NOW",
              "badge": ""
            },
            {
              "id": "2",
              "name": "ELITE ATHLETE",
              "price": "$89",
              "period": "MONTH",
              "features": [
                "24/7 Facility Access",
                "CrossFit & HIIT classes",
                "Unrestricted platforms",
                "Custom Macro program",
                "Monthly body composition scan"
              ],
              "ctaText": "GO ELITE",
              "badge": "POPULAR"
            },
            {
              "id": "3",
              "name": "CHAMPIONSHIP ELITE",
              "price": "$199",
              "period": "MONTH",
              "features": [
                "All Elite Athlete benefits",
                "Weekly 1-on-1 coaching (1hr)",
                "Access to Recovery Spa",
                "Complimentary post-workout shakes",
                "Priority platform reservation"
              ],
              "ctaText": "START CHAMPION",
              "badge": "ULTIMATE"
            }
          ],
          "services": [
            {
              "id": "1",
              "tag": "HIGH INTENSITY",
              "title": "CrossFit & HIIT",
              "description": "Explosive conditioning circuits and functional workouts designed to shatter plateaus and build relentless athletic endurance.",
              "image": "assets/crossfit.png",
              "type": "large"
            },
            {
              "id": "2",
              "tag": "STRENGTH",
              "title": "Weight Training",
              "description": "Premium free weights, precision machinery, and specialized powerlifting platforms for targeted hypertrophy and max effort lifts.",
              "image": "assets/bodybuilding.png",
              "type": "medium"
            },
            {
              "id": "3",
              "tag": "PT",
              "title": "Personal Training",
              "description": "1-on-1 bio-mechanic training with certified coaches committed to your physical evolution.",
              "image": "",
              "icon": "personal_training",
              "type": "small"
            },
            {
              "id": "4",
              "tag": "NUTRITION",
              "title": "Nutrition Consulting",
              "description": "Custom macro-nutritional programming and supplement strategies backed by metabolic science to optimize body composition and recovery rates.",
              "image": "",
              "icon": "nutrition",
              "type": "wide"
            },
            {
              "id": "5",
              "tag": "SPORTS",
              "title": "Adult Sports",
              "description": "Structured leagues, combat sports, and group athletic training for competitive team performance.",
              "image": "",
              "icon": "sports",
              "type": "full"
            }
          ]
        };
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
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
