"use client";

import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/SEOHead";

export default function RefundPolicyPage() {
  return (
    <>
      <SEOHead
        title="Refund & Return Policy"
        description="TreasureHub's refund and return policy for consignment services and buyers."
        canonical="https://treasurehub.club/policies/refund-policy"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Refund & Return Policy
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
                1. Overview
              </h2>
              <p className="text-gray-700 leading-relaxed">
                TreasureHub is committed to providing exceptional consignment
                and buying services. This policy outlines the circumstances
                under which refunds or returns may be provided, the process for
                requesting them, and our commitment to a fair, transparent
                experience for both buyers and sellers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Service Cancellation
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may cancel our consignment services at any time with written
                notice. Upon cancellation:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  We will immediately stop all active listing and marketing
                  efforts.
                </li>
                <li>
                  Any unsold items will be returned to you within 7 business
                  days.
                </li>
                <li>
                  We will provide a final accounting of any sales and
                  commissions.
                </li>
                <li>No additional fees will be charged after cancellation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Refund & Return Eligibility for Buyers
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.1 24-Hour Return Window
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Buyers have 24 hours from the time of delivery or pickup to
                request a return for any reason, provided the item is in the
                same condition as received.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>
                  Returns requested after 24 hours will only be accepted if
                  covered under the "Not as Described Guarantee" (Section 3.2).
                </li>
                <li>
                  Buyers are responsible for returning the item to TreasureHub
                  in its original condition.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.2 Not as Described Guarantee
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If an item arrives damaged, inoperable, missing components, or
                otherwise materially different from the listing description and
                photos, the buyer is eligible for a full refund, including any
                applicable delivery fees.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Buyers must submit photo or video evidence within 24 hours of
                  delivery.
                </li>
                <li>
                  If approved, TreasureHub will arrange pickup of the item at no
                  additional cost to the buyer.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Refund Eligibility for Consignment Services
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Full refunds may be provided in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>
                  <strong>Service Not Provided:</strong> If we are unable to
                  provide the agreed-upon services due to circumstances beyond
                  our control
                </li>
                <li>
                  <strong>Item Rejection:</strong> If we determine during
                  initial assessment that an item cannot be sold due to legal,
                  safety, or authenticity concerns
                </li>
                <li>
                  <strong>Technical Errors:</strong> If our systems fail and
                  prevent proper service delivery
                </li>
                <li>
                  <strong>Force Majeure:</strong> If services cannot be provided
                  due to natural disasters, government actions, or other
                  unforeseeable events
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Partial refunds may be provided in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  <strong>Early Termination:</strong> If you cancel services
                  after we have begun work but before completion
                </li>
                <li>
                  <strong>Service Delays:</strong> If we experience significant
                  delays in providing services due to our operational issues
                </li>
                <li>
                  <strong>Quality Issues:</strong> If the quality of our
                  services falls significantly below our stated standards
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Non-Refundable Items
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following are generally non-refundable:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Commission fees for items that have already sold and cleared
                  the 24-hour return period.
                </li>
                <li>Costs incurred for item transportation and handling.</li>
                <li>
                  Professional photography and listing creation services already
                  completed.
                </li>
                <li>
                  Authentication and quality assessment services already
                  performed.
                </li>
                <li>Marketing and advertising costs already incurred.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Refund & Return Process
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.1 For Buyers
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To request a return or refund:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>
                  Contact us at support@treasurehub.club or call (713) 899-3656
                  within 24 hours of delivery.
                </li>
                <li>Provide your order details and reason for the return.</li>
                <li>
                  Include photos or video evidence if claiming under the Not as
                  Described Guarantee.
                </li>
                <li>
                  Allow 3–5 business days for review and instructions on next
                  steps.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.2 For Consignment Clients
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To request a service-related refund:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Follow the same contact process as above, citing your
                  consignment account details.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Refund Processing
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Once approved:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Refunds will be issued within 7–10 business days.</li>
                <li>
                  Refunds will be made to the original payment method when
                  possible.
                </li>
                <li>
                  You will receive confirmation via email when the refund is
                  processed.
                </li>
                <li>
                  Bank processing times may vary depending on your financial
                  institution.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Dispute Resolution
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you disagree with our decision:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>You may request a review by our management team.</li>
                <li>
                  Provide additional documentation or evidence to support your
                  case.
                </li>
                <li>
                  We will conduct a thorough review and provide a final decision
                  within 10 business days.
                </li>
                <li>
                  If resolution cannot be reached, disputes will be settled
                  through binding arbitration.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Item Returns for Consignment Clients
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For unsold items or items removed from consignment:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Items will be returned within 7 business days of service
                  termination.
                </li>
                <li>
                  You are responsible for pickup or shipping costs for returned
                  items.
                </li>
                <li>
                  Items must be picked up within 30 days or may be subject to
                  storage fees.
                </li>
                <li>We will provide a detailed inventory of returned items.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about this refund policy or to request a refund,
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
