const fs = require('fs');
const path = require('path');

const isKvEnabled = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
};

const getFromKv = async (key) => {
  try {
    const url = `${process.env.KV_REST_API_URL}/get/${key}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
      }
    });
    if (!res.ok) {
      console.error(`KV GET failed for key ${key}: ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : null;
  } catch (err) {
    console.error(`Error fetching key ${key} from KV:`, err);
    return null;
  }
};

const setToKv = async (key, value) => {
  try {
    const url = process.env.KV_REST_API_URL;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', key, JSON.stringify(value)])
    });
    if (!res.ok) {
      console.error(`KV SET failed for key ${key}: ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error setting key ${key} in KV:`, err);
    return false;
  }
};

module.exports = {
  isKvEnabled,
  getFromKv,
  setToKv
};
