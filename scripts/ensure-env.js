const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const envFiles = [
  {
    example: path.join(root, 'backend', '.env.example'),
    target: path.join(root, 'backend', '.env'),
  },
  {
    example: path.join(root, 'front-end', '.env.example'),
    target: path.join(root, 'front-end', '.env'),
  },
];

for (const { example, target } of envFiles) {
  if (fs.existsSync(target)) {
    console.log(`Keeping existing ${path.relative(root, target)}`);
    continue;
  }

  fs.copyFileSync(example, target);
  console.log(`Created ${path.relative(root, target)} from ${path.relative(root, example)}`);
}
