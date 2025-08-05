import mailchimp from '@mailchimp/mailchimp_marketing';
import { prisma } from './prisma';

// Configure Mailchimp
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., 'us7'
});

export async function addEmailToMailchimp(email: string, source: string = 'website') {
  try {
    console.log('addEmailToMailchimp called with email and source');
    
    // Validate environment variables
    if (!process.env.MAILCHIMP_API_KEY) {
      console.error('MAILCHIMP_API_KEY is missing');
      return { success: false, error: 'Mailchimp API key not configured' };
    }
    
    if (!process.env.MAILCHIMP_AUDIENCE_ID) {
      console.error('MAILCHIMP_AUDIENCE_ID is missing');
      return { success: false, error: 'Mailchimp audience ID not configured' };
    }
    
    if (!process.env.MAILCHIMP_SERVER_PREFIX) {
      console.error('MAILCHIMP_SERVER_PREFIX is missing');
      return { success: false, error: 'Mailchimp server prefix not configured' };
    }

    // Get the next signup number first
    console.log('Getting next signup number...');
    const signupNumber = await getNextSignupNumber();
    console.log('Next signup number:', signupNumber);
    
    // First, add to Mailchimp with merge fields
    const isTop200 = signupNumber <= 200;
    const tags = ['treasurehub'];
    if (isTop200) {
      tags.push('Early-Access');
    }

    // Debug: Log the signup number being sent to Mailchimp
    console.log(`Adding member to Mailchimp with signup number: ${signupNumber}`);
    console.log('Mailchimp config:', {
      audienceId: process.env.MAILCHIMP_AUDIENCE_ID,
      serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX,
      hasApiKey: !!process.env.MAILCHIMP_API_KEY,
      apiKeyLength: process.env.MAILCHIMP_API_KEY?.length || 0,
      serverPrefixLength: process.env.MAILCHIMP_SERVER_PREFIX?.length || 0
    });
    
    // Test API connection first
    try {
      const accountInfo = await mailchimp.ping.get();
      console.log('✅ Mailchimp API connection successful:', accountInfo);
    } catch (pingError) {
      console.error('❌ Mailchimp API connection failed:', pingError);
      return { success: false, error: 'Mailchimp API connection failed' };
    }
    
    // Test audience read permissions
    try {
      const audienceInfo = await mailchimp.lists.getListMember(process.env.MAILCHIMP_AUDIENCE_ID!, 'test@example.com');
      console.log('✅ Audience write access test successful');
    } catch (audienceError: any) {
      if (audienceError.response?.status === 404) {
        console.log('✅ Audience write access test successful (expected 404 for non-existent member)');
      } else {
        console.error('❌ Audience access failed:', audienceError);
        return { success: false, error: 'Mailchimp audience access failed - check API key permissions' };
      }
    }
    
    // Log the merge fields being sent
    console.log('📝 Sending merge fields:', {
      SIGNUP_NUM: signupNumber.toString(),
      SOURCE: source,
      IS_TOP_200: isTop200 ? 'Yes' : 'No'
    });
    
    const mailchimpResponse = await mailchimp.lists.addListMember(
      process.env.MAILCHIMP_AUDIENCE_ID!,
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: '',
          LNAME: '',
          ADDRESS: '',
          PHONE: '',
          BIRTHDAY: '',
          COMPANY: '',
          SIGNUP_NUM: signupNumber.toString(),
          SOURCE: source,
          IS_TOP_200: isTop200 ? 'Yes' : 'No',
        },
      }
    );

    console.log('Mailchimp response:', mailchimpResponse);

    // Add tags separately if user is in top 200
    if (isTop200) {
      try {
        await mailchimp.lists.updateListMemberTags(
          process.env.MAILCHIMP_AUDIENCE_ID!,
          email,
          {
            tags: [
              {
                name: 'Early-Access',
                status: 'active'
              }
            ]
          }
        );
        console.log('Added Early-Access tag successfully');
      } catch (tagError) {
        console.log('Could not add Early-Access tag:', tagError);
      }
    }

    // Then, save to database with the same sequential number
    try {
      console.log('Saving to database...');
      const dbSignup = await prisma.earlyAccessSignup.create({
        data: {
          email,
          source,
          signupNumber,
        },
      });
      console.log('Database save successful:', dbSignup);

      return {
        success: true,
        data: mailchimpResponse,
        signupNumber: dbSignup.signupNumber,
      };
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      if (dbError.code === 'P2002') {
        // Email already exists in database
        console.log('Email already exists in database');
        const existingSignup = await prisma.earlyAccessSignup.findUnique({
          where: { email },
        });
        
        return {
          success: true,
          message: 'Email already subscribed',
          signupNumber: existingSignup?.signupNumber,
        };
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('addEmailToMailchimp error:', error);
    
    // Handle specific Mailchimp errors
    if (error.response?.body?.title === 'Member Exists') {
      console.log('Member already exists in Mailchimp');
      // Email already exists in Mailchimp, check if it exists in database
      try {
        const existingSignup = await prisma.earlyAccessSignup.findUnique({
          where: { email },
        });

        if (existingSignup) {
          // Email exists in both Mailchimp and database
          console.log('Email exists in both Mailchimp and database');
          return {
            success: true,
            message: 'Email already subscribed',
            signupNumber: existingSignup.signupNumber,
          };
        } else {
          // Email exists in Mailchimp but not in database, add to database
          console.log('Email exists in Mailchimp but not in database, adding to database');
          const signupNumber = await getNextSignupNumber();
          const dbSignup = await prisma.earlyAccessSignup.create({
            data: {
              email,
              source,
              signupNumber,
            },
          });

          // Try to update the existing Mailchimp member with merge fields and tags
          try {
            const isTop200 = signupNumber <= 200;
            const tags = ['treasurehub'];
            if (isTop200) {
              tags.push('Early-Access');
            }

            // Debug: Log the signup number being updated in Mailchimp
            console.log(`Updating existing member in Mailchimp with signup number: ${signupNumber}`);
            
            await mailchimp.lists.setListMember(
              process.env.MAILCHIMP_AUDIENCE_ID!,
              email,
              {
                email_address: email,
                status: 'subscribed',
                status_if_new: 'subscribed',
                merge_fields: {
                  FNAME: '',
                  LNAME: '',
                  ADDRESS: '',
                  PHONE: '',
                  BIRTHDAY: '',
                  COMPANY: '',
                  SIGNUP_NUM: signupNumber.toString(),
                  SOURCE: source,
                  IS_TOP_200: isTop200 ? 'Yes' : 'No',
                },
              }
            );

            // Add tags separately if user is in top 200
            if (isTop200) {
              try {
                await mailchimp.lists.updateListMemberTags(
                  process.env.MAILCHIMP_AUDIENCE_ID!,
                  email,
                  {
                    tags: [
                      {
                        name: 'Early-Access',
                        status: 'active'
                      }
                    ]
                  }
                );
              } catch (tagError) {
                console.log('Could not add Early-Access tag:', tagError);
              }
            }
          } catch (updateError) {
            console.log('Could not update existing Mailchimp member:', updateError);
          }

          return {
            success: true,
            message: 'Email already subscribed',
            signupNumber: dbSignup.signupNumber,
          };
        }
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        return {
          success: false,
          error: 'Failed to process subscription',
        };
      }
    }

    // Log detailed error information
    console.error('Mailchimp error details:', {
      message: error.message,
      response: error.response?.body,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorType: error.constructor.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Log the specific errors array if available
    if (error.response?.body?.errors) {
      console.error('🔍 Specific merge field errors:', JSON.stringify(error.response.body.errors, null, 2));
    }

    return {
      success: false,
      error: error.message || 'Failed to subscribe',
    };
  }
}

// Helper function to get the next sequential signup number
async function getNextSignupNumber(): Promise<number> {
  const lastSignup = await prisma.earlyAccessSignup.findFirst({
    orderBy: {
      signupNumber: 'desc',
    },
  });

  return (lastSignup?.signupNumber || 0) + 1;
}

// Function to get top N signups
export async function getTopSignups(limit: number = 200) {
  try {
    const signups = await prisma.earlyAccessSignup.findMany({
      where: {
        signupNumber: {
          lte: limit,
        },
      },
      orderBy: {
        signupNumber: 'asc',
      },
      select: {
        id: true,
        email: true,
        signupNumber: true,
        source: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: signups,
      total: signups.length,
    };
  } catch (error) {
    console.error('Error fetching top signups:', error);
    return {
      success: false,
      error: 'Failed to fetch signups',
    };
  }
}

// Function to get signup statistics
export async function getSignupStats() {
  try {
    const totalSignups = await prisma.earlyAccessSignup.count();
    const top200Count = await prisma.earlyAccessSignup.count({
      where: {
        signupNumber: {
          lte: 200,
        },
      },
    });

    const remainingSpots = Math.max(0, 200 - top200Count);

    return {
      success: true,
      data: {
        totalSignups,
        top200Count,
        isTop200Available: top200Count < 200,
        remainingSpots,
      },
    };
  } catch (error) {
    console.error('Error fetching signup stats:', error);
    return {
      success: false,
      error: 'Failed to fetch signup statistics',
    };
  }
} 

// Utility function to create merge fields in Mailchimp (run once for setup)
// Note: Merge fields must be created manually in the Mailchimp dashboard
// Go to Audience > Settings > Audience name and defaults > Merge fields
// Add these merge fields:
// - SIGNUP_NUM (text)
// - SOURCE (text) 
// - IS_TOP_200 (text)
export async function setupMailchimpMergeFields() {
  console.log('⚠️  Merge fields must be created manually in Mailchimp dashboard');
  console.log('📋 Go to Audience > Settings > Audience name and defaults > Merge fields');
  console.log('📝 Add these merge fields:');
  console.log('   - SIGNUP_NUM (text)');
  console.log('   - SOURCE (text)');
  console.log('   - IS_TOP_200 (text)');
  console.log('✅ Once created, uncomment the merge_fields in the addEmailToMailchimp function');
  
  return { success: true, message: 'Please create merge fields manually in Mailchimp dashboard' };
} 