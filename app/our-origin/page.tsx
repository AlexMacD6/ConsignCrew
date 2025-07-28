"use client";

import React from "react";
import { motion } from "framer-motion";

export default function OurOriginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our Origin
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Oilfield Precision. Garage-Sale Simplicity.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Headshot */}
              <div className="flex-shrink-0">
                <img
                  src="/Headshot - Alex.jpg"
                  alt="Alex MacDonald - Founder of TreasureHub"
                  className="w-64 h-64 object-cover rounded-2xl shadow-lg"
                />
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  I'm Alex MacDonald. An oil-patch engineer who hates wasting my
                  free time. Ten years of running drilling rigs taught me an
                  important lesson: when every second costs big money, you
                  obsess over making processes as simple as possible. That
                  mindset is what drove me to build TreasureHub.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Back at home, my garage keeps filling up with perfectly good
                  gear through the years — a dresser, a pair of old skis, a set
                  of spare rims for a car I no longer own, and a stack of
                  dumbbells. How many of you can say the same?
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Posting each item online meant fighting through which messages
                  are bots or scams, then negotiating on price, arranging a
                  meet-up, inviting strangers into your home, and praying the
                  buyer actually showed up to not waste your free time. I kept
                  thinking, why can't someone handle this process for me?
                </p>
              </div>
            </div>
          </motion.div>

          {/* Pain Points Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              The Real Pain:
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-treasure-500 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Headache
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Solution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      Paying strangers with cash
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      Almost nowhere else in your day-to-day life do you pay
                      with cash anymore, why for selling your stuff? No cash
                      hand-offs needed, all payments are processed via Stripe.
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      Haggling over price
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      The price is set via a discount schedule and only reserved
                      for the first person to "Buy It Now". Reducing the number
                      of messages by 95%.
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      Coordinating pick-up/drop-off times is challenging
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      Pick-up/drop-off times are easily coordinated via the app
                      only after the item is sold.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Proof of Concept */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-treasure-500/10 to-treasure-600/10 border border-treasure-500/20 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              The Proof-of-Concept:
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Target window
                </h3>
                <p className="text-gray-700">August 2025</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pilot zone
                </h3>
                <p className="text-gray-700">
                  Houston (within the 610 loop to start)
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Scope
                </h3>
                <p className="text-gray-700">
                  50+ items (furniture, baby gear, fitness equipment, etc.). No
                  vehicles or clothing will be accepted.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-treasure-500 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Phase
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      What we'll test
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Success metric
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      1. One-Tap Listing
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      Upload 2 photos minimum → auto-price → auto-list
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      &lt; 60 second or less listing time
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      2. Concierge Pick-Up
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      Truck & trailer, route optimization, and quality control
                      checks.
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      100% on-time pick-ups
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      3. Secure Cash-Out
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      Buyer pays via card; Seller receives payment once item
                      passes QA/QC checks and buyer accepts delivery.
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      Zero cash-hand-offs, seller payment within 24 hours of
                      delivery.
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">
                      4. Feedback Loop
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      Both Buyer and Seller rate the transaction via SMS/email
                      micro-survey
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      ≥ 4.5★ Average Satisfaction
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border border-treasure-500/20">
              <p className="text-gray-700">
                Early access sign-ups earn a family and friends rate of{" "}
                <span className="font-bold text-treasure-600">
                  15% off the service fee
                </span>{" "}
                on their first transaction. They will have direct access to the
                team building the application for any feedback or suggestions.
                We'll tweak things until the process feels as friction-free as
                hailing a rideshare.
              </p>
            </div>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              The Mission:
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              If the proof-of-concept is successful, two great things happen:
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-treasure-500 rounded-full mt-3"></div>
                <p className="text-gray-700">
                  Households free up space and get paid without any hassle.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-treasure-500 rounded-full mt-3"></div>
                <p className="text-gray-700">
                  Quality items stay in circulation, giving a new life to items
                  that no longer serve a purpose for you.
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              That's the kind of efficiency any Dad with an over-stuffed garage
              like me can get behind.
            </p>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gradient-to-r from-treasure-500 to-treasure-600 rounded-2xl p-8 text-center text-white"
          >
            <h3 className="text-2xl font-bold mb-4">
              Thanks for hopping on the wait-list
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Your invite to the August proof-of-concept is coming soon.
            </p>
            <div className="text-center">
              <p className="text-lg font-semibold">— Alex</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
