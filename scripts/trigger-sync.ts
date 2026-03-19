import axios from "axios";

const GITLAB_API_URL = "http://10.10.184.118:8929/api/v4";
const PROJECT_ID = "141";
const TOKEN = "glpat-R3-oCGBxeF4J2GqYkO3w2m86MQp1OjkH.01.0w1pftp3z";

async function triggerMirrorPull() {
  const url = `${GITLAB_API_URL}/projects/${PROJECT_ID}/mirror/pull`;
  console.log(`Triggering Mirror Pull on GitLab for Project ${PROJECT_ID}...`);

  try {
    const res = await axios.post(url, {}, {
      headers: { "PRIVATE-TOKEN": TOKEN }
    });
    console.log("✅ Success triggering mirror pull:", res.data);
  } catch (error: any) {
    if (error.response) {
      console.error("❌ API Error:", error.response.data);
      console.error(`Status code: ${error.response.status}`);
    } else {
      console.error("❌ Request Error:", error.message);
    }
  }
}

triggerMirrorPull();
