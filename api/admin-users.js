const fs = require('fs');
const path = require('path');
const { isKvEnabled, getFromKv, setToKv } = require('./_kv');

const getFilePath = () => {
  const fileName = 'admin-users.json';
  const tmpPath = path.join('/tmp', fileName);
  const localPath = path.join(process.cwd(), fileName);
  
  if (!fs.existsSync(tmpPath)) {
    try {
      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, tmpPath);
      } else {
        const defaultUsers = [{ username: "The Fitness HUB", password: "thefitnesshub@25" }];
        fs.writeFileSync(tmpPath, JSON.stringify(defaultUsers, null, 2));
      }
    } catch (e) {
      console.error('Error copying admin-users file to /tmp:', e);
    }
  }
  
  return fs.existsSync(tmpPath) ? tmpPath : localPath;
};

module.exports = async (req, res) => {
  if (isKvEnabled()) {
    if (req.method === 'GET') {
      try {
        let users = await getFromKv('fitness_hub_admin_users');
        if (!users) {
          users = [{ username: "The Fitness HUB", password: "thefitnesshub@25" }];
          await setToKv('fitness_hub_admin_users', users);
        }
        return res.status(200).json(users);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    } else if (req.method === 'POST') {
      try {
        const users = req.body;
        await setToKv('fitness_hub_admin_users', users);
        return res.status(200).json({ status: 'success' });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }

  const filePath = getFilePath();
  
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(filePath)) {
        const defaultUsers = [{ username: "The Fitness HUB", password: "thefitnesshub@25" }];
        fs.writeFileSync(filePath, JSON.stringify(defaultUsers, null, 2));
      }
      const fileData = fs.readFileSync(filePath, 'utf8');
      return res.status(200).json(JSON.parse(fileData));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const users = req.body;
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
