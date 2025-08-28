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
            A Family Business Born from Everyday Frustrations.
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
              {/* Family Photo */}
              <div className="flex-shrink-0">
                <img
                  src="/MacDonald Family.jpg"
                  alt="The MacDonald Family - Alex, Leanne, and Madeleine"
                  className="w-80 h-64 object-cover rounded-2xl shadow-lg"
                />
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  We're the MacDonald family — Alex, Leanne, and our daughter
                  Madeleine. As an oil-patch engineer, Alex spent ten years
                  running drilling rigs where every second costs big money,
                  learning to obsess over making processes as simple as
                  possible. That mindset is what drove us to build TreasureHub
                  together as a family business.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Like many families, our garage kept filling up with perfectly
                  good gear through the years — furniture that no longer fits
                  our space, toys Madeleine has outgrown, exercise equipment
                  gathering dust, and that inevitable stack of items we keep
                  meaning to sell. We knew other families faced the same
                  challenge.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  The traditional process of selling items online became a
                  family frustration: fighting through bot messages and scams,
                  endless negotiations, coordinating meet-ups around work and
                  family schedules, and hoping buyers would actually show up.
                  Leanne and Alex kept asking, "Why can't someone just handle
                  this entire process for busy families like us?"
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
                  free delivery for the first month
                </span>{" "}
                for all transactions. They will have direct access to the team
                building the application for any feedback or suggestions. We'll
                tweak things until the process feels as friction-free as hailing
                a rideshare.
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
              That's the kind of efficiency any family with an over-stuffed
              garage like ours can get behind. We're building TreasureHub to
              solve a problem we live with every day, and we believe other
              families will benefit from the solution just as much as we will.
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
              <p className="text-lg font-semibold">— The MacDonald Family</p>
              <p className="text-sm opacity-90 mt-1">
                Alex, Leanne, and Madeleine
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
