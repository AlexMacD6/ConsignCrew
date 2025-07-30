"use client";

import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/SEOHead";

export default function CyberIncidentResponsePlanPage() {
  return (
    <>
      <SEOHead
        title="Cyber Incident Response Plan"
        description="TreasureHub's comprehensive cyber incident response procedures and protocols."
        canonical="https://treasurehub.club/policies/cyber-incident-response-plan"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Cyber Incident Response Plan (IRP)
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
                1. Purpose and Goals
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The purpose of this cyber incident response plan ("IRP") is to
                provide a structured and systematic incident response process
                for all information security incidents that affect any of
                TreasureHub's information technology ("IT") systems, network, or
                data, including TreasureHub's data held or IT services provided
                by third-party vendors or other service providers.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.1 Specifically, TreasureHub's goals for this IRP include to:
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Define TreasureHub's cyber incident response process and
                  provide step-by-step guidelines for establishing a timely,
                  consistent, and repeatable incident response process.
                </li>
                <li>
                  Assist TreasureHub and any applicable third parties in quickly
                  and efficiently responding to and recovering from different
                  levels of information security incidents.
                </li>
                <li>
                  Mitigate or minimize the effects of any information security
                  incident on TreasureHub, its users, customers, employees, or
                  others.
                </li>
                <li>
                  Help TreasureHub consistently document the actions it takes in
                  response to information security incidents.
                </li>
                <li>Reduce overall risk exposure for TreasureHub.</li>
                <li>
                  Engage stakeholders and drive appropriate participation in
                  resolving information security incidents while fostering
                  continuous improvement in TreasureHub's information security
                  program and incident response process.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Scope
              </h2>
              <p className="text-gray-700 leading-relaxed">
                This IRP applies to all TreasureHub business groups, divisions,
                and subsidiaries; their employees, contractors, officers, and
                directors; and TreasureHub's IT systems, network, data, and any
                computer systems or networks connected to TreasureHub's network.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Accountability
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub has designated Alex MacDonald to implement and
                maintain this IRP (the "information security coordinator").
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.1 Information Security Coordinator Duties
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Among other information security duties, the information
                security coordinator shall be responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Implementing this IRP.</li>
                <li>
                  Coordinating activities, including developing, maintaining,
                  and following appropriate procedures to respond to,
                  appropriately escalate, make decisions regarding, and document
                  identified information security incidents.
                </li>
                <li>
                  Conducting post-incident reviews to gather feedback on
                  information security incident response procedures and address
                  any identified gaps in security measures.
                </li>
                <li>
                  Reviewing this IRP at least annually, or whenever there is a
                  material change in TreasureHub's business practices that may
                  reasonably affect its cyber incident response procedures.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Definitions
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.1 "Confidential Information"
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Confidential information means information that may cause harm
                to TreasureHub or its users, employees, or other entities or
                individuals if improperly disclosed, or that is not otherwise
                publicly available.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.2 "Personal Information"
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Personal information means any information relating to an
                identified or identifiable natural person that TreasureHub owns,
                licenses, or maintains and that is from or about an individual
                including, but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>First and last name</li>
                <li>
                  Home or other physical address, including street name and name
                  of city or town
                </li>
                <li>
                  Email address or other online information, such as a user name
                  and password
                </li>
                <li>Telephone number</li>
                <li>Government-issued identification or other number</li>
                <li>Financial or payment card account number</li>
                <li>Date of birth</li>
                <li>
                  Health information, including information regarding the
                  individual's medical history or mental or physical condition,
                  or medical treatment or diagnosis by a health care
                  professional, created or received by TreasureHub
                </li>
                <li>Any information that is combined with any of the above</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.3 "Information Security Incident"
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Information security incident means an actual or reasonably
                suspected:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Loss or theft of confidential or personal information</li>
                <li>
                  Unauthorized use, disclosure, acquisition of or access to, or
                  other unauthorized processing of confidential or personal
                  information that reasonably may compromise the privacy or
                  confidentiality, integrity, or availability of confidential or
                  personal information
                </li>
                <li>
                  Unauthorized access to or use of, inability to access, loss or
                  theft of, or malicious infection of TreasureHub's IT systems
                  or third party systems that reasonably may compromise the
                  privacy or confidentiality, integrity, or availability of
                  confidential or personal information or TreasureHub's
                  operating environment or services
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Incident Response Personnel
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The incident response personnel consists solely of Alex
                MacDonald at this moment, and he is responsible for responding
                to information security incidents. Alex MacDonald is also
                considered the information security coordinator for the purposes
                of this IRP.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                5.1 Responsibilities
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Alex MacDonald is responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Addressing information security incidents in a timely manner,
                  according to this IRP.
                </li>
                <li>
                  Managing internal and external communications regarding
                  information security incidents.
                </li>
                <li>
                  Reporting findings to applicable authorities, as appropriate.
                </li>
                <li>
                  Reprioritizing other work responsibilities to permit a timely
                  response to information security incidents on notification.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Incident Response Procedures
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.1 Detection and Discovery
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub shall develop, implement, and maintain procedures to
                detect, discover, and assess potential information security
                incidents through automated means and individual reports.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>
                  <strong>Automated Detection:</strong> TreasureHub shall
                  develop, implement, and maintain automated detection means and
                  other technical safeguards.
                </li>
                <li>
                  <strong>Reports from Employees:</strong> Employees shall
                  immediately report any actual or suspected information
                  security incident to Alex MacDonald.
                </li>
                <li>
                  <strong>Reports from External Sources:</strong> External
                  sources who claim to have information regarding an actual or
                  alleged information security incident should be directed to
                  Alex MacDonald.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.2 Containment, Remediation, and Recovery
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub shall develop, implement, and maintain procedures to
                contain any data or cybersecurity breaches, and remediate and
                recover the data if possible.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.3 Communications and Notifications
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                For each identified information security incident, Alex
                MacDonald shall determine and direct appropriate internal and
                external communications and any required notifications.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  <strong>Authorities:</strong> Notify applicable regulators,
                  law enforcement, or other authorities.
                </li>
                <li>
                  <strong>Affected Individuals:</strong> If an applicable breach
                  of personal information occurs, prepare and distribute
                  notifications to affected individuals.
                </li>
                <li>
                  <strong>Cyber Insurance Carrier:</strong> Notify TreasureHub's
                  cyber insurance carrier according to the terms and conditions
                  of its current policy.
                </li>
                <li>
                  <strong>Others:</strong> Notify users or business partners
                  according to current agreements.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.4 Post-Incident Review
              </h3>
              <p className="text-gray-700 leading-relaxed">
                At a time reasonably following each identified information
                security incident, the information security coordinator shall
                assess the incident and TreasureHub's response, including
                monitoring and coordinating completion of any follow-up actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Plan Review
              </h2>
              <p className="text-gray-700 leading-relaxed">
                TreasureHub will review this IRP at least annually, or whenever
                there is a material change in TreasureHub's business practices
                that may reasonably affect its cyber incident response
                procedures. Plan reviews will also include feedback collected
                from post-incident reviews and training and testing exercises.
                The information security coordinator must approve any changes to
                this IRP and is responsible for communicating changes to
                affected parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Send any suggested changes or other feedback on this IRP to Alex
                MacDonald.
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Alex MacDonald</strong>
                  <br />
                  Information Security Coordinator
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
