const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const aiResponses = [
  // Pickup & Delivery
  {
    category: 'Pickup & Delivery',
    triggerPhrases: ['Do you deliver?', 'Can I get it delivered?', 'Is delivery available?'],
    response: 'Yes, local delivery is available for an added fee at checkout.',
    tags: ['delivery', 'logistics'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'Pickup & Delivery',
    triggerPhrases: ['Can I pick this up?', 'Where do I go to pick up?', 'How do I get the item?'],
    response: 'After checkout, we\'ll send you a link to schedule a pickup time or choose delivery.',
    tags: ['pickup', 'logistics'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'Pickup & Delivery',
    triggerPhrases: ['Can I come today?', 'Do you offer same day?'],
    response: 'We offer next-day delivery in most cases. Same-day options may be available based on location.',
    tags: ['delivery', 'same-day'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  // Pricing & Offers
  {
    category: 'Pricing & Offers',
    triggerPhrases: ['Can I offer less?', 'Is the price negotiable?', 'Will you take less?'],
    response: 'All TreasureHub listings are fixed-price to protect both buyers and sellers. No haggling necessary!',
    tags: ['pricing', 'offers'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'Pricing & Offers',
    triggerPhrases: ['Why is this so expensive?', 'Is this the lowest price?'],
    response: 'Our pricing reflects market value and seller expectations. You can always save the item to watch for markdowns.',
    tags: ['pricing'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  // Item Details
  {
    category: 'Item Details',
    triggerPhrases: ['What are the dimensions?', 'How big is it?', 'What size is this?'],
    response: 'Dimensions are typically listed in the product description. If not, we\'ll reach out to verify.',
    tags: ['dimensions', 'size'],
    autoResponse: true,
    escalateIfUnclear: true
  },
  {
    category: 'Item Details',
    triggerPhrases: ['Is this damaged?', 'Any scratches?', 'What condition is it in?'],
    response: 'Each item is visually reviewed for condition. Unless noted, items are in good, gently used shape.',
    tags: ['condition'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'Item Details',
    triggerPhrases: ['Does this work?', 'Is it functional?', 'Is it tested?'],
    response: 'Items are listed as functional unless otherwise noted. Electronics are sold as-is unless specified.',
    tags: ['functionality', 'electronics'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'Item Details',
    triggerPhrases: ['Can I see more pictures?', 'Do you have other angles?'],
    response: 'What you see is what\'s currently available. We can request more photos from the seller if needed.',
    tags: ['photos'],
    autoResponse: true,
    escalateIfUnclear: true
  },
  // Availability
  {
    category: 'Availability',
    triggerPhrases: ['Is this still available?', 'Can I buy it now?', 'Is this item taken?'],
    response: 'If the listing is live, the item is still available!',
    tags: ['availability'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'Availability',
    triggerPhrases: ['Can I put it on hold?', 'Will you reserve this for me?'],
    response: 'To be fair to all buyers, we don\'t offer holds. Checkout guarantees your item.',
    tags: ['availability', 'hold'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  // Returns & Refunds
  {
    category: 'Returns & Refunds',
    triggerPhrases: ['What if I don\'t like it?', 'Can I return it?', 'Do you offer refunds?'],
    response: 'All sales are final, but let us know if something isn\'t as described and we\'ll make it right.',
    tags: ['returns', 'refunds'],
    autoResponse: true,
    escalateIfUnclear: true
  },
  // Buyer Help
  {
    category: 'Buyer Support',
    triggerPhrases: ['I have a question', 'Can I talk to the seller?', 'How do I ask about this item?'],
    response: 'We manage all communication to protect sellers. Ask us anything and we\'ll get the answer for you.',
    tags: ['buyer', 'questions'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  // Payment & Checkout
  {
    category: 'Payment & Checkout',
    triggerPhrases: ['What payment methods do you accept?', 'Can I pay with Venmo or cash?'],
    response: 'We accept all major cards securely online. No cash or off-platform payments, please.',
    tags: ['payment', 'checkout'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'Payment & Checkout',
    triggerPhrases: ['How do I pay?', 'Where do I checkout?', 'I want to buy it now'],
    response: 'Click "Buy Now" on the listing page to complete your purchase. It\'s fast and secure.',
    tags: ['payment', 'checkout'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  // Delivery Confirmation
  {
    category: 'Delivery Updates',
    triggerPhrases: ['Where\'s my item?', 'Can I track my delivery?', 'Is the driver on the way?'],
    response: 'Track your item in real-time using your TreasureHub tracking link. We\'ll update you every step of the way.',
    tags: ['delivery', 'tracking'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  // General
  {
    category: 'General',
    triggerPhrases: ['What is TreasureHub?', 'How does this work?', 'What do you do?'],
    response: 'TreasureHub connects sellers with buyers through a trusted, local resale platform. We handle the hard parts.',
    tags: ['about', 'platform'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  {
    category: 'General',
    triggerPhrases: ['How do I sell something?', 'Can I list my own item?', 'Do you take consignments?'],
    response: 'Yes! Head to treasurehub.club/list-item to get started. We pick it up, list it, and handle everything for you.',
    tags: ['seller', 'intake'],
    autoResponse: true,
    escalateIfUnclear: false
  },
  // Trust & Safety
  {
    category: 'Trust & Safety',
    triggerPhrases: ['Is this safe?', 'How do I know it\'s legit?', 'Can I trust this?'],
    response: 'All sellers are verified and items are reviewed by our team. Buy with confidence.',
    tags: ['trust', 'safe'],
    autoResponse: true,
    escalateIfUnclear: false
  }
];

async function populateAiResponses() {
  try {
    console.log('Starting to populate AI responses...');
    
    // Clear existing data
    await prisma.aiResponse.deleteMany({});
    console.log('Cleared existing AI responses');
    
    // Insert new data
    const createdResponses = await prisma.aiResponse.createMany({
      data: aiResponses
    });
    
    console.log(`Successfully created ${createdResponses.count} AI responses`);
    
    // Verify the data was inserted
    const count = await prisma.aiResponse.count();
    console.log(`Total AI responses in database: ${count}`);
    
  } catch (error) {
    console.error('Error populating AI responses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateAiResponses(); 