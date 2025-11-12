import React from "react";

// Type definitions
export interface FAQItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
  category: string;
  helpful?: number;
  notHelpful?: number;
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  items: FAQItem[];
}

// FAQ Data
export const faqData = [
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Learn how TreasureHub works and how to join.",
    items: [
      {
        id: "what-is-treasurehub",
        question: "What is TreasureHub and how does it work?",
        answer: `TreasureHub is a one‑click consignment platform that handles the entire selling process for you. Simply list your item in our app, schedule a pickup when it sells, and we'll pack, ship, and deliver it. Once your item sells, we notify you and initiate your payout—no hidden steps or surprise fees.`,
      },
      {
        id: "join-early-access",
        question: "How do I join the early‑access list?",
        answer: `Just enter your email in the signup form on our homepage and click "Join the Crew." You'll receive a confirmation email and periodic updates about our beta launch and exclusive perks.`,
      },
      {
        id: "waitlist-free",
        question: "Is joining the waitlist free?",
        answer: `Yes—joining our waitlist is completely free, and there's no obligation to use TreasureHub once we launch.`,
      },
    ],
  },
  {
    id: "listing-items",
    name: "Listing Your Items",
    description: "How to list, edit, and manage your items.",
    items: [
      {
        id: "how-to-list",
        question: "How do I list an item for consignment?",
        answer: (
          <ol className="list-decimal list-inside space-y-1">
            <li>Snap or upload photos of your item in the app.</li>
            <li>Enter a title, description, and your asking price.</li>
            <li>Hit "List."</li>
            <li>
              We'll review (for quality and authenticity), then post your item
              live in our network.
            </li>
          </ol>
        ),
      },
      {
        id: "what-can-i-sell",
        question: "What kinds of items can I sell through TreasureHub?",
        answer: `We support a wide range of consumer goods—electronics, fashion, home décor, collectibles, and more. During beta we'll publish a detailed list; if you're not sure, just add your item and we'll let you know if it fits.`,
      },
      {
        id: "edit-remove-listing",
        question: "Can I edit or remove my listing before it ships?",
        answer: `Absolutely. Head to "My Listings," select the item, and choose "Edit" or "Remove." If it's already in transit, contact Support and we'll help cancel or reroute as needed.`,
      },
    ],
  },
  {
    id: "pricing-discounts",
    name: "Pricing & Discounts",
    description:
      "Understanding our pricing structure and automatic discount schedules.",
    items: [
      {
        id: "discount-schedules",
        question: "How do the automatic discount schedules work?",
        answer: (
          <div className="space-y-4">
            <p>
              TreasureHub offers two automatic discount schedules to help your
              items sell faster. These schedules automatically reduce your
              item's price over time to attract more buyers.
            </p>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-blue-600 mb-3">
                  Turbo-30 (30-Day Schedule)
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Price drops every 3 days</strong>
                </p>
                <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left font-medium py-2 px-2">Day</th>
                        <th className="text-left font-medium py-2 px-2">
                          Price
                        </th>
                        <th className="text-left font-medium py-2 px-2">
                          Drop
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 px-2">0</td>
                        <td className="py-1 px-2">100%</td>
                        <td className="py-1 px-2">0%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">3</td>
                        <td className="py-1 px-2">95%</td>
                        <td className="py-1 px-2">-5%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">6</td>
                        <td className="py-1 px-2">90%</td>
                        <td className="py-1 px-2">-10%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">9</td>
                        <td className="py-1 px-2">85%</td>
                        <td className="py-1 px-2">-15%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">12</td>
                        <td className="py-1 px-2">80%</td>
                        <td className="py-1 px-2">-20%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">15</td>
                        <td className="py-1 px-2">75%</td>
                        <td className="py-1 px-2">-25%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">18</td>
                        <td className="py-1 px-2">70%</td>
                        <td className="py-1 px-2">-30%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">21</td>
                        <td className="py-1 px-2">65%</td>
                        <td className="py-1 px-2">-35%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">24</td>
                        <td className="py-1 px-2">60%</td>
                        <td className="py-1 px-2">-40%</td>
                      </tr>
                      <tr className="border-t border-gray-200">
                        <td className="py-1 px-2 font-medium">30</td>
                        <td className="py-1 px-2 font-medium">Expire</td>
                        <td className="py-1 px-2 font-medium">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  • Expires after 30 days
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-green-600 mb-3">
                  Classic-60 (60-Day Schedule)
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Price drops every 7 days</strong>
                </p>
                <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left font-medium py-2 px-2">Day</th>
                        <th className="text-left font-medium py-2 px-2">
                          Price
                        </th>
                        <th className="text-left font-medium py-2 px-2">
                          Drop
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 px-2">0</td>
                        <td className="py-1 px-2">100%</td>
                        <td className="py-1 px-2">0%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">7</td>
                        <td className="py-1 px-2">90%</td>
                        <td className="py-1 px-2">-10%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">14</td>
                        <td className="py-1 px-2">80%</td>
                        <td className="py-1 px-2">-20%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">21</td>
                        <td className="py-1 px-2">75%</td>
                        <td className="py-1 px-2">-25%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">28</td>
                        <td className="py-1 px-2">70%</td>
                        <td className="py-1 px-2">-30%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">35</td>
                        <td className="py-1 px-2">65%</td>
                        <td className="py-1 px-2">-35%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">42</td>
                        <td className="py-1 px-2">60%</td>
                        <td className="py-1 px-2">-40%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">49</td>
                        <td className="py-1 px-2">55%</td>
                        <td className="py-1 px-2">-45%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">56</td>
                        <td className="py-1 px-2">50%</td>
                        <td className="py-1 px-2">-50%</td>
                      </tr>
                      <tr className="border-t border-gray-200">
                        <td className="py-1 px-2 font-medium">60</td>
                        <td className="py-1 px-2 font-medium">Expire</td>
                        <td className="py-1 px-2 font-medium">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  • 25% drop triggers opt-out modal
                </p>
                <p className="text-sm text-gray-500">• Expires after 60 days</p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All schedules respect your reserve price
                minimum. Your item will never drop below the reserve price you
                set.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "reserve-price",
        question: "What is a reserve price and how does it work?",
        answer: `A reserve price is the minimum amount you're willing to accept for your item. Even with automatic discount schedules, your item's price will never drop below this amount. This ensures you always get a fair price for your item.`,
      },
      {
        id: "opt-out-discounts",
        question: "Can I opt out of automatic discounts?",
        answer: `Yes! When you list an item, you can choose "No Discount Schedule" to keep your price fixed. You can also edit your listing at any time to change or remove the discount schedule.`,
      },
    ],
  },
  {
    id: "pickup-delivery",
    name: "Pickup & Delivery",
    description: "How pickup and delivery work with TreasureHub.",
    items: [
      {
        id: "how-pickups-scheduled",
        question: "How do pickups get scheduled?",
        answer: `Once your item sells, we'll send you a link to pick a convenient date, time window, and address. Our crew shows up, scans the QR‑label, and you're done.`,
      },
      {
        id: "packaging-needed",
        question: "What packaging do I need to provide?",
        answer: `No need to hunt for boxes or tape—we supply all packaging materials during pickup. Just have your item ready; we'll bring the rest.`,
      },
      {
        id: "shipping-time",
        question: "How long does shipping take?",
        answer: `After pickup, most deliveries complete within 2–5 business days (U.S. domestic). You'll see expected transit times when you schedule your pickup.`,
      },
    ],
  },
  {
    id: "tracking-notifications",
    name: "Tracking & Notifications",
    description: "Stay updated on your item's journey.",
    items: [
      {
        id: "track-progress",
        question: "How can I track my item's progress?",
        answer: `Log in to the TreasureHub dashboard or scan your QR code to view real‑time status—from "Picked Up" to "Delivered."`,
      },
      {
        id: "notifications",
        question: "What notifications will I receive (and how)?",
        answer: (
          <ul className="list-disc list-inside space-y-1">
            <li>Is picked up</li>
            <li>Enters transit</li>
            <li>Is out for delivery</li>
            <li>Has been delivered</li>
            <li>Has sold</li>
          </ul>
        ),
      },
      {
        id: "real-time-updates",
        question: "Can I get real‑time updates on delivery status?",
        answer: `Yes—our in‑app tracker updates live as the courier scans each checkpoint. You can also share tracking links with friends or family.`,
      },
    ],
  },
  {
    id: "payout-post-sale",
    name: "Payout & Post‑Sale",
    description: "What happens after your item sells.",
    items: [
      {
        id: "what-happens-when-sells",
        question: "What happens when my item sells?",
        answer: `When a buyer completes checkout, we process the sale, send you a confirmation, and initiate your payout. Meanwhile, the package is en route to them.`,
      },
      {
        id: "notified-of-sale",
        question: "How and when will I be notified of a sale?",
        answer: `You'll get an instant email (and in‑app notification) with sale details. Funds are typically available in your account within 24 hours of sale confirmation.`,
      },
    ],
  },
  {
    id: "account-privacy",
    name: "Account & Data Privacy",
    description: "Your privacy and data rights.",
    items: [
      {
        id: "is-info-safe",
        question: "Is my personal information safe with TreasureHub?",
        answer: `Absolutely. We use industry‑standard encryption (SSL/TLS) and never share your data with third parties without your consent.`,
      },
      {
        id: "how-use-email",
        question: "How will you use my email address?",
        answer: `We'll send you product updates, beta invitations, and service notifications. You can opt out of marketing emails at any time.`,
      },
      {
        id: "unsubscribe-delete-data",
        question: "Can I unsubscribe or delete my data at any time?",
        answer: `Yes—every email has an "unsubscribe" link, and you can request full data deletion by contacting us at privacy@treasurehub.club.`,
      },
    ],
  },
  {
    id: "support",
    name: "Support",
    description: "How to get help or make changes.",
    items: [
      {
        id: "contact-support",
        question: "Who do I contact if I have questions or issues?",
        answer: `Email our Support team at support@treasurehub.club or use the in‑app chat button. We aim to respond within 24 hours.`,
      },
      {
        id: "cancel-pickup",
        question: "Can I cancel a scheduled pickup or delivery?",
        answer: `Yes—just log in, go to "My Pickups," select the appointment, and click "Cancel" or "Reschedule." If you run into any trouble, our Support team will assist you.`,
      },
    ],
  },
];
