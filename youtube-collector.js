const https = require('https');
const fs = require('fs');

const apiKey = process.env.BRIGHTDATA_API_KEY;
const query = 'n8n tutorial';
const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
const datasetId = 'gd_m5mbdl081229ln6t4a'; // youtube_videos from the python script

const triggerPayload = JSON.stringify([{
  url: searchUrl,
  num_of_results: 10
}]);

const triggerOptions = {
  hostname: 'api.brightdata.com',
  path: `/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(triggerPayload)
  }
};

const triggerReq = https.request(triggerOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const triggerData = JSON.parse(data);
      if (triggerData.snapshot_id) {
        console.log(`Snapshot triggered with ID: ${triggerData.snapshot_id}`);
        pollSnapshot(triggerData.snapshot_id);
      } else {
        console.error('Failed to trigger snapshot:', data);
      }
    } else {
      console.error(`API trigger request failed with status code: ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

triggerReq.on('error', (e) => {
  console.error(`Problem with trigger request: ${e.message}`);
});

triggerReq.write(triggerPayload);
triggerReq.end();

function pollSnapshot(snapshotId) {
  const pollOptions = {
    hostname: 'api.brightdata.com',
    path: `/datasets/v3/snapshot/${snapshotId}?format=json`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  };

  const pollReq = https.request(pollOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const snapshotData = JSON.parse(data);
        if (snapshotData.status === 'running') {
          console.log('Snapshot is still running, polling again in 5 seconds...');
          setTimeout(() => pollSnapshot(snapshotId), 5000);
        } else {
          fs.writeFileSync('youtube_results.json', JSON.stringify(snapshotData, null, 2));
          console.log('Successfully collected YouTube videos and saved to youtube_results.json');
        }
      } else {
        console.error(`API poll request failed with status code: ${res.statusCode}`);
        console.error('Response:', data);
      }
    });
  });

  pollReq.on('error', (e) => {
    console.error(`Problem with poll request: ${e.message}`);
  });

  pollReq.end();
}