const { spawn } = require('child_process');
const fs = require('fs');

// Start the Go program
const child = spawn('go', ['run', '.']);

const testHTML = fs.readFileSync('test.html', 'utf8')

// Create request message
const request = JSON.stringify({ html: testHTML });
const buffer = Buffer.alloc(4 + request.length);
buffer.writeUInt32LE(request.length, 0);
buffer.write(request, 4);

// Send request
child.stdin.write(buffer);

// Read response
child.stdout.once('data', (data) => {
  const length = data.readUInt32LE(0);
  const response = JSON.parse(data.toString('utf8', 4, 4 + length));

  console.log('Response:', response);
  console.log('Success:', response.success);
  console.log('Links found:', response.links.length);

  child.stdin.end();
  process.exit(0);
});

child.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});
