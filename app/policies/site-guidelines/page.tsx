"use client";

import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/SEOHead";

export default function SiteGuidelinesPage() {
  return (
    <>
      <SEOHead
        title="Site Guidelines"
        description="Guidelines and rules for using TreasureHub's consignment services and website."
        canonical="https://treasurehub.club/policies/site-guidelines"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Site Guidelines
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
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These guidelines establish the rules and expectations for using
                TreasureHub's consignment services and website. By using our
                services, you agree to follow these guidelines and understand
                that violations may result in account suspension or termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Acceptable Items
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.1 Items We Accept
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub accepts a wide variety of items for consignment,
                including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>Electronics and technology</li>
                <li>Furniture and home decor</li>
                <li>Clothing and accessories</li>
                <li>Sports equipment and outdoor gear</li>
                <li>Collectibles and antiques</li>
                <li>Books, media, and entertainment</li>
                <li>Tools and equipment</li>
                <li>Jewelry and watches</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.2 Items We Do Not Accept
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                For safety, legal, and quality reasons, we do not accept:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Counterfeit or replica items</li>
                <li>Stolen or illegally obtained items</li>
                <li>Weapons, ammunition, or explosives</li>
                <li>Hazardous materials or chemicals</li>
                <li>Perishable items or food</li>
                <li>Items with safety recalls</li>
                <li>Items that are broken beyond repair</li>
                <li>Items that violate intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. User Conduct
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.1 Prohibited Activities
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Users are prohibited from:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>Providing false or misleading information about items</li>
                <li>Attempting to sell items they do not own</li>
                <li>Using our services for illegal activities</li>
                <li>Harassing or threatening other users or staff</li>
                <li>Attempting to circumvent our security measures</li>
                <li>Creating multiple accounts to avoid restrictions</li>
                <li>Sharing account credentials with others</li>
                <li>Using automated tools to access our services</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.2 Expected Behavior
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Users are expected to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate and complete information about items</li>
                <li>Respond promptly to communications from our team</li>
                <li>Treat our staff and other users with respect</li>
                <li>Follow all applicable laws and regulations</li>
                <li>Maintain the security of their account</li>
                <li>Report any suspicious or inappropriate activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Item Quality Standards
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.1 Condition Requirements
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Items must meet the following quality standards:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>Be in good working condition</li>
                <li>Be clean and presentable</li>
                <li>Have all necessary components and accessories</li>
                <li>Be free from significant damage or defects</li>
                <li>Comply with safety standards</li>
                <li>Be authentic and not counterfeit</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.2 Item Preparation
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Before submitting items for consignment:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Clean and prepare items appropriately</li>
                <li>Remove personal information and data</li>
                <li>
                  Include all original packaging and manuals when possible
                </li>
                <li>Provide accurate descriptions and history</li>
                <li>Disclose any known issues or defects</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Communication Guidelines
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                5.1 Professional Communication
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All communications should be:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>Professional and respectful</li>
                <li>Clear and concise</li>
                <li>Free from offensive language</li>
                <li>Truthful and accurate</li>
                <li>Timely and responsive</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                5.2 Response Times
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We strive to respond to all inquiries within 24 hours during
                business days. Users are expected to respond to our
                communications within 48 hours to maintain efficient service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Privacy and Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Users must respect privacy and security:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Do not share personal information of others</li>
                <li>Protect your account credentials</li>
                <li>Report any security concerns immediately</li>
                <li>Do not attempt to access other users' accounts</li>
                <li>Follow our data protection practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Dispute Resolution
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If disputes arise:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Contact us directly to resolve issues</li>
                <li>Provide all relevant information and documentation</li>
                <li>Allow reasonable time for investigation and resolution</li>
                <li>Follow our established dispute resolution procedures</li>
                <li>
                  Maintain professional communication throughout the process
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Violations and Consequences
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                8.1 Types of Violations
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Violations may result in:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>Warning and education about our policies</li>
                <li>Temporary suspension of account privileges</li>
                <li>Permanent account termination</li>
                <li>Legal action if necessary</li>
                <li>Reporting to appropriate authorities</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                8.2 Appeal Process
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Users may appeal account actions by contacting our support team
                with a detailed explanation of the circumstances and any
                relevant evidence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Updates to Guidelines
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These guidelines may be updated periodically to reflect changes
                in our services, legal requirements, or business practices.
                Users will be notified of significant changes, and continued use
                of our services constitutes acceptance of updated guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these guidelines or to report violations,
                please contact us:
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
