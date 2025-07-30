"use client";

import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/SEOHead";

export default function TermsOfServicePage() {
  return (
    <>
      <SEOHead
        title="Terms of Service"
        description="Terms and conditions for using TreasureHub's consignment services."
        canonical="https://treasurehub.club/policies/terms-of-service"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600">Last updated: July 13, 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 space-y-8"
          >
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using TreasureHub's consignment services, you
                accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub provides professional consignment services
                including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Item pickup and transportation</li>
                <li>Professional cleaning and preparation</li>
                <li>High-quality photography and listing creation</li>
                <li>Authentication and quality assessment</li>
                <li>Online marketplace listing and management</li>
                <li>Secure payment processing</li>
                <li>Customer service and support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. User Responsibilities
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                As a user of TreasureHub's services, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Provide accurate and complete information about items you wish
                  to consign
                </li>
                <li>
                  Ensure you have legal ownership of all items submitted for
                  consignment
                </li>
                <li>Not submit counterfeit, stolen, or illegal items</li>
                <li>
                  Cooperate with our authentication and quality assessment
                  processes
                </li>
                <li>Maintain accurate contact information</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Commission and Fees
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub charges a commission based on the final sale price
                of your items:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Items under $100: 50% commission</li>
                <li>Items $100-$500: 40% commission</li>
                <li>Items over $500: 35% commission</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Commission rates are subject to change with 30 days notice. All
                fees are clearly disclosed before service begins.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Payment Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Payment for sold items will be processed within 7 business days
                of successful sale completion. Payments are made via secure
                electronic transfer or check, as agreed upon during service
                setup.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Sales Tax
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Buyers will be subject to the required sales tax as per the
                state and county jurisdiction where the transaction occurs.
                TreasureHub will collect this sales tax on your behalf and remit
                it to the appropriate state government.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Sales tax rates vary by location and item type</li>
                <li>
                  Tax will be calculated and added to the final purchase price
                </li>
                <li>TreasureHub handles all tax collection and remittance</li>
                <li>Tax amounts are clearly displayed during checkout</li>
                <li>
                  Tax compliance is handled in accordance with applicable laws
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Item Handling and Liability
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub takes reasonable care in handling your items, but we
                are not liable for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Damage during normal handling and preparation processes</li>
                <li>Loss or damage due to circumstances beyond our control</li>
                <li>
                  Items that are inherently fragile or damaged prior to receipt
                </li>
                <li>Market fluctuations affecting item value</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We maintain appropriate insurance coverage for items in our
                care.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Privacy and Data Protection
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. We collect, use, and protect
                your personal information in accordance with our Privacy Policy.
                By using our services, you consent to our data practices as
                described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Termination
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Either party may terminate this agreement with written notice.
                Upon termination, we will return any unsold items in our
                possession and provide a final accounting of sales and
                commissions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Dispute Resolution
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Any disputes arising from this agreement will be resolved
                through good faith negotiation. If resolution cannot be reached,
                disputes will be settled through binding arbitration in
                accordance with the laws of Texas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms of Service, please contact us
                at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>TreasureHub</strong>
                  <br />
                  Email: support@treasurehub.club
                  <br />
                  Phone: (713) 899-3656
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
}
