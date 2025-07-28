const { setupMailchimpMergeFields } = require('../app/lib/mailchimp');

async function main() {
  console.log('Setting up Mailchimp merge fields...');
  
  try {
    const result = await setupMailchimpMergeFields();
    
    if (result.success) {
      console.log('✅ Successfully set up Mailchimp merge fields!');
      console.log('📧 You can now use these merge fields in your Mailchimp emails:');
      console.log('   - *|SIGNUP_NUMBER|* - The sequential signup number');
      console.log('   - *|SOURCE|* - Where the signup came from (hero, modal, etc.)');
      console.log('   - *|IS_TOP_200|* - Whether they are in the top 200 (Yes/No)');
      console.log('');
      console.log('🎯 Example usage in Mailchimp email:');
      console.log('   "Congratulations! You are signup number *|SIGNUP_NUMBER|*"');
      console.log('   "You are *|IS_TOP_200|* in the top 200 early access members!"');
    } else {
      console.error('❌ Failed to set up merge fields:', result.error);
    }
  } catch (error) {
    console.error('❌ Error running setup:', error);
  }
}

main(); 