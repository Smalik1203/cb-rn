// scripts/validate-env.js
// Environment validation script for Expo

const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('📝 Please create a .env file based on .env.example');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = [];
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (!match || !match[1].trim()) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log('\n📝 Please update your .env file with the missing variables');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set!');
  console.log('🚀 You can now run: npm run start');
}

validateEnvironment();
