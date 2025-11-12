"use client";

import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/SEOHead";

export default function InformationSecurityPolicyPage() {
  return (
    <>
      <SEOHead
        title="Information Security Policy"
        description="TreasureHub's comprehensive information security policy and data protection measures."
        canonical="https://treasurehub.club/policies/information-security-policy"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Information Security Policy
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
                1. Introduction: Policy Foundation and Regulatory Compliance
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Information Security Policy (Policy) promotes an effective
                balance between information security practices and business
                needs. The Policy helps TreasureHub meet our legal obligations
                and our users' expectations. From time to time, TreasureHub may
                implement different levels of security controls for different
                information assets based on risk and other considerations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are expected to read, understand, and follow this Policy.
                However, no single policy can cover all the possible information
                security issues you may face. You must seek guidance from your
                manager or other designated TreasureHub resource before taking
                any actions that create information security risks or otherwise
                deviate from this Policy's requirements. TreasureHub may treat
                any failure to seek and follow such guidance as a violation of
                this Policy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Policy is Confidential Information. Do not share this
                Policy outside TreasureHub unless authorized by the Information
                Security Coordinator. You may share this Policy with an approved
                contractor that has access to TreasureHub's information or
                systems under a non-disclosure agreement or other agreement that
                addresses confidentiality (see Section 7, Service Providers:
                Risks and Governance).
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.1 Guiding Principles
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub follows these guiding principles when developing and
                implementing information security controls:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>
                  TreasureHub strives to protect the confidentiality, integrity,
                  and availability of its information assets and those of its
                  users.
                </li>
                <li>
                  We will comply with applicable information security, privacy,
                  and data protection laws.
                </li>
                <li>
                  We will balance the need for business efficiency with the need
                  to protect sensitive, proprietary, or other confidential
                  information from undue risk.
                </li>
                <li>
                  We will grant access to sensitive, proprietary, or other
                  confidential information only to those with a need to know and
                  at the least level of privilege necessary to perform their
                  assigned functions.
                </li>
                <li>
                  Recognizing that an astute workforce is the best line of
                  defense, we will provide security training opportunities and
                  expert resources to help individuals understand and meet their
                  information security obligations.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.2 Scope
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Policy applies across the entire TreasureHub enterprise.
                This Policy provides detailed information security guidance that
                you must follow.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Policy states TreasureHub's information security policy. In
                many cases, you are personally responsible for taking or
                avoiding specific actions as the Policy states. In some
                situations, the Information Security Coordinator, or another
                TreasureHub resource takes or avoids the stated actions.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                From time to time, TreasureHub may approve and make available
                more detailed or location or business unit-specific policies,
                procedures, standards, and processes to address specific
                information security issues. Those additional policies,
                procedures, standards, and processes are extensions to this
                Policy. You must comply with them, where applicable, unless you
                obtain an approved exception.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.3 Resources
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                No single document can cover all the possible information
                security issues you may face. Balancing our need to protect
                TreasureHub's information assets with getting work done can also
                be challenging. Many effective administrative, physical, and
                technical safeguards are available. Do not make assumptions
                about the cost or time required to implement them. Ask for help.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must seek guidance before taking any actions that create
                information security risks.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>
                  For questions about this Policy or technical information
                  security issues contact: Alex MacDonald, as Information
                  Security Coordinator; or
                </li>
                <li>
                  For guidance regarding legal obligations contact: Alex
                  MacDonald.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.4 No Expectation of Privacy and Monitoring
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Except where applicable law provides otherwise, you should have
                no expectation of privacy when using TreasureHub's network,
                services or systems, including, but not limited to, transmitting
                and storing files, data, and messages.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                To enforce compliance with TreasureHub's policies and protect
                TreasureHub's interests, TreasureHub reserves the right to
                monitor any use of its network, services and systems to the
                extent permitted by applicable law. By using TreasureHub's
                systems, you agree to such monitoring. Monitoring may include
                (but is not necessarily limited to) intercepting and reviewing
                network traffic, emails, or other messages or data sent or
                received and inspecting data stored on individual file
                directories, devices, or other printed or online media.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.5 Regulatory Compliance
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Various information security laws, regulations, and industry
                standards apply to TreasureHub and the data we handle.
                TreasureHub is committed to complying with applicable laws,
                regulations, and standards.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
                <li>
                  <strong>Personal Information:</strong> Data Protection and
                  Breach Notification Laws. Various laws protect individuals'
                  personal information, such as government-assigned numbers,
                  financial account information, and other sensitive data. Many
                  jurisdictions have enacted data breach notification laws that
                  require organizations to notify affected individuals if
                  personal information is lost or accessed by unauthorized
                  parties. Some locations have data protection laws that require
                  organizations to protect personal information using reasonable
                  data security measures or more specific means. These laws may
                  apply to personal information for TreasureHub's employees,
                  users and customers, business partners, and others.
                </li>
                <li>
                  TreasureHub strives to be compliant with industry-standard
                  security frameworks and regulations.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Responsibilities: Security Organization, Authority, and
                Obligations
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub and its leadership recognize the need for a strong
                information security program.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.1 Information Security Coordinator
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub has designated Alex MacDonald to be its Information
                Security Coordinator and accountable for all aspects of its
                information security program. References to the Information
                Security Coordinator throughout this Policy include the
                Information Security Coordinator and their designates.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.2 Policy Authority and Maintenance
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub has granted the Information Security Coordinator the
                authority to develop, maintain, and enforce this Policy and any
                additional policies, procedures, standards, and processes, as
                they may deem necessary and appropriate.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.3 Policy Review
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                On at least an annual basis, the Information Security
                Coordinator will initiate a review of this Policy, engaging
                stakeholders such as individual business units, Human Resources,
                Legal, and other TreasureHub organizations, as appropriate.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.4 Exceptions
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub recognizes that specific business needs and local
                situations may occasionally call for an exception to this
                Policy. Exception requests must be made in writing. The
                Information Security Coordinator must approve in writing,
                document, and periodically review all exceptions.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                To request an exception, contact Alex MacDonald.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.5 Workforce Obligation to Comply
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Employees and contractors are obligated to comply with all
                aspects of this Policy that apply to them. This Policy is not
                intended to restrict communications or actions protected or
                required by applicable law.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub may treat any attempt to bypass or circumvent
                security controls as a violation of this Policy. For example,
                sharing access credentials, including passwords or multifactor
                authentication means, deactivating anti-malware software,
                removing or modifying secure configurations, or creating
                unauthorized network connections are prohibited unless the
                Information Security Coordinator has granted an exception as
                described in Section 2.4, Exceptions.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.6 Sanctions
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any violation of this Policy may result in disciplinary action
                or other sanctions. Sanctions may include suspension, access
                restrictions, work assignment limitations, or more severe
                penalties up to and including termination, in accordance with
                applicable law. If TreasureHub suspects illegal activities, it
                may report them to the applicable authorities and aid in any
                investigation or prosecution of the individuals involved.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.7 Acknowledgment
              </h3>
              <p className="text-gray-700 leading-relaxed">
                All employees and contractors must acknowledge that they have
                read, understood, and agree to comply with this Policy either in
                writing or through an approved online process. Acknowledgment
                must be completed on a timely basis following a new hire or as
                otherwise designated by the Information Security Coordinator.
                Material changes to this Policy may require additional
                acknowledgment. TreasureHub will retain acknowledgment records.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Data: Information Classification and Risk-Based Controls
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub has established a three-tier classification scheme
                to protect information according to risk levels. The information
                classification scheme allows TreasureHub to select appropriate
                security controls and balance protection needs with costs and
                business efficiencies.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                All TreasureHub information is classified as (from least to most
                sensitive): (1) Public Information, (2) Confidential
                Information, or (3) Highly Confidential Information.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Unless it is marked otherwise or clearly intended to be Public
                Information, treat all TreasureHub and user information as if it
                is at least Confidential Information, regardless of its source
                or form, including online, paper, verbal, or other information.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must apply security controls appropriate for the assigned
                information classification level to all information you store,
                transmit, or otherwise handle. Use classification level
                markings, where feasible.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.1 Public Information
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Public Information is information that TreasureHub has made
                available to the general public. Information received from
                another party (including a user) that is covered under a
                current, signed non-disclosure agreement must not be classified
                or treated as Public Information.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Public Information Examples.</strong> Some Public
                Information examples include, but are not limited to: press
                releases, TreasureHub marketing materials; job announcements;
                and any information that TreasureHub makes available on its
                publicly accessible website[s].
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.2 Confidential Information
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Confidential Information is information that may cause harm to
                TreasureHub, its users, employees, or other entities or
                individuals if improperly disclosed, or that is not otherwise
                publicly available. Harms may relate to an individual's privacy,
                TreasureHub's marketplace position or that of its users, or
                legal or regulatory liabilities.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Confidential Information Examples.</strong> Some
                Confidential Information examples include, but are not limited
                to: TreasureHub financial data, user lists, revenue forecasts,
                program or project plans, and intellectual property;
                user-provided data, information, and intellectual property (see
                also, Section 3.3, Highly Confidential Information, regarding
                personal information); user contracts and contracts with other
                external parties, including vendors, and other like materials.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Safeguards.</strong> You must protect Confidential
                Information with specific administrative, physical, and
                technical safeguards implemented according to risks and treat
                with the utmost care.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.3 Highly Confidential Information
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Highly Confidential Information is information that may cause
                serious and potentially irreparable harm to TreasureHub, its
                users, employees, or other entities or individuals if disclosed
                or used in an unauthorized manner. Highly Confidential
                Information is a subset of Confidential Information that
                requires additional protection.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Highly Confidential Information Examples.</strong> Some
                Highly Confidential Information examples include, but are not
                limited to: personal information for employees, users, business
                partners, or others; and sensitive TreasureHub business
                information, such as budgets, financial results, or strategic
                plans.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Safeguards.</strong> You must protect Highly
                Confidential Information with specific administrative, physical,
                and technical safeguards implemented according to risks and as
                prescribed by applicable laws, regulations, and standards, and
                handle and treat with the utmost care.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Information Assets: Protecting and Managing TreasureHub's
                Information Technology Environment
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This section describes key safeguards that TreasureHub uses to
                protect and manage its information technology (IT) environment.
                You must support their use to the extent that they apply to you.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.1 Protecting Information Assets
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Install and configure TreasureHub-owned computers and other
                hardware according to current technical standards and
                procedures, including anti-malware software, other standard
                security controls, and approved operating system version and
                software patches. TreasureHub supports preventive controls to
                avoid unauthorized activities or access to data, based on risk
                levels. TreasureHub supports detective controls to timely
                discover unauthorized activities or access to data, including
                continuous system monitoring and event management.
              </p>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                (a) Perimeter Controls
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                Perimeter controls secure TreasureHub's network against external
                attacks. Use firewalls, configured according to current
                technical standards and procedures, to separate TreasureHub's
                trusted network from the internet or internet-facing
                environments.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub may implement additional perimeter controls
                including intrusion detection and prevention services, data loss
                prevention software, specific router or other network
                configurations, or various forms of network monitoring according
                to risks. Do not create internet connections outside perimeter
                controls.
              </p>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                (b) Data and Network Segmentation
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub may use technical controls, such as firewalls,
                access control lists, or other mechanisms, to segment some data
                or areas of its network according to risks. Segment Highly
                Confidential Information from the rest of TreasureHub's network
                to the extent technically feasible and reasonable (see Section
                3.3, Highly Confidential Information). Do not alter network
                segmentation plans without approval from the Information
                Security Coordinator.
              </p>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                (c) Encryption
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub uses encryption to protect Confidential and Highly
                Confidential Information according to risks. TreasureHub may
                apply encryption to stored data (data-at-rest) and transmitted
                data (data-in-transit). Encrypting personal information may
                lower TreasureHub's liability if a data breach occurs.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Only use generally accepted encryption algorithms and products
                approved by the Information Security Coordinator. Periodically
                review encryption products and algorithms for any known risks.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Laws may limit exporting some encryption technologies. Seek
                guidance from Legal prior to exporting or making any encryption
                technologies available to individuals outside the U.S.
              </p>

              <h5 className="text-md font-semibold text-gray-800 mb-2">
                (i) Encryption Key Management
              </h5>
              <p className="text-gray-700 leading-relaxed mb-4">
                Encryption algorithms use keys to transform and secure data.
                Because they allow decryption of the protected data, proper key
                management is crucial. Select encryption keys to maximize
                protection levels, to the extent feasible and reasonable. Treat
                them as Highly Confidential Information.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ensure that keys are available when needed to support data
                decryption by using secure storage methods and creating and
                maintaining secure backups. Track access to keys. Keys should
                never be known or available to only a single individual. Change
                encryption keys on a periodic basis according to risks.
              </p>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                (d) Data and Media Disposal
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                When TreasureHub retires or otherwise removes computing,
                network, or office equipment (such as printers, copiers, or fax
                machines) or other information assets that may contain
                Confidential or Highly Confidential Information from the
                business, specific steps must be taken to scrub or otherwise
                render the media unreadable.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Simply deleting files or reformatting disks is not sufficient to
                prevent data recovery. Either physically destroy media,
                according to applicable waste disposal regulations, or scrub it
                using data wiping software that meets generally accepted data
                destruction standards. For example, see the National Institute
                of Standards and Technology Special Publication 800-88,
                Guidelines for Media Sanitization.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.2 Managing Information Assets
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Alex MacDonald manages IT operations and related activities at
                TreasureHub, including development of software and other
                applications.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Only TreasureHub-supplied or approved software, hardware, and
                information systems, whether procured or developed, may be
                installed in TreasureHub's IT environment or connected to
                TreasureHub's network.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Incident Reporting and Response.</strong> The
                Information Security Coordinator maintains a cyber incident
                reporting and response process that ensures management
                notifications are made based on the seriousness of the incident.
                The Information Security Coordinator investigates all reported
                or detected incidents and documents the outcome, including any
                mitigation activities or other remediation steps taken.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.3 Incident Reporting
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Immediately notify Alex MacDonald if you discover a cyber
                incident or suspect a breach in TreasureHub's information
                security controls. TreasureHub maintains various forms of
                monitoring and surveillance to detect cyber incidents, but you
                may be the first to become aware of a problem. Early detection
                and response can mitigate damages and minimize further risk to
                TreasureHub.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Treat any information regarding cyber incidents as Highly
                Confidential Information and do not share it, internally or
                externally, without specific authorization.
              </p>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                (a) Cyber Incident Examples
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cyber incidents vary widely and include physical and technical
                issues. Some examples of cyber incidents that you should report
                include, but are not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>
                  loss or suspected compromise of user credentials or physical
                  access devices (including passwords, tokens, keys, badges,
                  smart cards, devices containing authenticator software, or
                  other means of identification and authentication);
                </li>
                <li>
                  suspected malware infections, including viruses, Trojans,
                  spyware, worms, or any anomalous reports or messages from
                  anti-malware software or personal firewalls;
                </li>
                <li>
                  loss or theft of any device that contains TreasureHub
                  information (other than Public Information), including
                  computers, laptops, tablet computers, smartphones, USB drives,
                  disks, or other storage media;
                </li>
                <li>
                  suspected entry (hacking) into TreasureHub's network or
                  systems by unauthorized persons;
                </li>
                <li>
                  any breach or suspected breach of Confidential or Highly
                  Confidential Information;
                </li>
                <li>
                  any attempt by any person to obtain passwords, one-time use
                  codes, or other Confidential or Highly Confidential
                  Information in person or by phone, email, or other means
                  (sometimes called social engineering, or in the case of email,
                  phishing); and
                </li>
                <li>
                  any other any situation that appears to violate this Policy or
                  otherwise create undue risks to TreasureHub's information
                  assets.
                </li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                (b) Compromised Devices
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you become aware of a compromised computer or other device
                immediately notify Alex MacDonald.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.4 Incident Management
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Information Security Coordinator defines and maintains a
                cyber incident response plan to manage information security
                incidents. Report all suspected incidents, as described in this
                Policy, and then defer to the incident response process. Do not
                impede the incident response process or conduct your own
                investigation unless the Information Security Coordinator
                specifically requests or authorizes it.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.5 Cyber Incident or Data Breach Notification
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Applicable law may require TreasureHub to report cyber incidents
                that result in the exposure or loss of certain kinds of
                information or that affect certain services or infrastructure to
                various authorities or affected individuals or organizations, or
                both. Breaches of Highly Confidential Information (and
                especially personal information) are the most likely to carry
                these obligations (see Section 1.5, Regulatory Compliance). The
                Information Security Coordinator's incident response plan
                includes a step to review all incidents for any required
                notifications. Coordinate all external notifications with Legal
                and the Information Security Coordinator. Do not act on your own
                or make any external notifications without prior guidance and
                authorization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Service Providers: Risks and Governance
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Information Security Coordinator maintains a service
                provider risk governance program to oversee service providers
                that interact with TreasureHub's systems or Confidential or
                Highly Confidential Information. The service provider risk
                governance program includes processes to track service
                providers, evaluate service provider capabilities, and
                periodically assess service provider risks and compliance with
                this Policy.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                5.1 Service Provider Approval Required
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Obtain approval from the Information Security Coordinator before
                engaging a service provider to perform functions that involve
                access to TreasureHub's systems or Confidential or Highly
                Confidential Information.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                5.2 Contract Obligations
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Service providers that access TreasureHub's systems or
                Confidential or Highly Confidential Information must agree by
                contract to comply with applicable laws and this Policy or
                equivalent information security measures. TreasureHub may
                require service providers to demonstrate their compliance with
                applicable laws and this Policy by submitting to independent
                audits or other forms of review or certification based on risks.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. User Information: Managing Intake, Maintenance, and User
                Requests
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub frequently creates, receives, and manages data on
                behalf of our users. With guidance from the Information Security
                Coordinator, TreasureHub develops, implements, and maintains an
                appropriate process and procedures to manage users data intake
                and protection.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub user data intake and protection processes may vary
                but must include, at minimum, means for (1) identifying user
                data and any pertinent requirements prior to data intake or
                creation; (2) maintaining an inventory of user data created or
                received; and (3) ensuring TreasureHub implements and maintains
                appropriate information security measures, including proper data
                and media disposal when TreasureHub no longer has a business
                need to retain the user (or is no longer permitted to do so by
                user agreement).
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.1 Requirements Identification
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Identify any pertinent user data requirements before data intake
                or creation according to TreasureHub's user data intake and
                protection process. Requirements may be contractual or the
                result of applicable law or regulations, or both (see Section
                1.5, Regulatory Compliance).
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.2 Intake Management
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TreasureHub data intake processes and procedures must provide
                for secure data transfer. Maintain an inventory of user data
                that includes, at a minimum:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>
                  A description of the user data, including TreasureHub's use
                  purposes;
                </li>
                <li>the location(s) where the data is stored;</li>
                <li>
                  who is authorized to access the data (by category or role, if
                  appropriate);
                </li>
                <li>
                  whether the data is Confidential or Highly Confidential
                  Information;
                </li>
                <li>
                  how long the data is to be retained (using criteria, if
                  appropriate); and
                </li>
                <li>
                  any specific contractual or regulatory obligations or other
                  identified data protection or management requirements.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Treat any user-provided personal information as Highly
                Confidential Information (see Section 3.3, Highly Confidential
                Information). To minimize risks for user and TreasureHub, engage
                user in an ongoing dialogue to determine whether business
                objectives can be met without transferring personal information
                to TreasureHub.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.3 User Data Protection
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Protect all user data TreasureHub creates or receives in
                accordance with this Policy and the data's information
                classification level, whether Confidential or Highly
                Confidential Information, in addition to any specific
                client-identified requirements.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                6.4 User Data and Media Disposal
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Ensure that any User data or media containing user data is
                securely disposed of when it is no longer required for
                TreasureHub business purposes, or as required by user agreement
                (see Data and Media Disposal). Update the applicable business
                unit user data inventory accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Risk and Compliance Management
              </h2>
              <p className="text-gray-700 leading-relaxed">
                TreasureHub supports an ongoing risk governance and risk
                management action cycle to (1) enforce this Policy; (2) identify
                and appropriately communicate information security risks; (3)
                develop risk-based procedures, safeguards, and controls; and (4)
                verify that safeguards and controls are in place and working
                properly. The Information Security Coordinator oversees,
                maintains and is responsible for all aspects of these processes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Effective Date
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Information Security Policy is effective as of July 13th,
                2025.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                8.1 Revision History
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Original publication.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about this Information Security Policy, please
                contact:
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
