"use client";

import { motion } from "framer-motion";

interface RoadmapPhase {
  title: string;
  time: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
}

const roadmapData: RoadmapPhase[] = [
  {
    title: "Private Beta",
    time: "August 2025",
    description: "Invite-only access for early adopters",
    details: [
      "Core platform features",
      "Direct feedback integration",
      "Invite-only for seller community",
    ],
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Public Launch",
    time: "September 2025",
    description: "Open to all users across Houston",
    details: [
      "Expanded categories",
      "Advanced pricing analytics",
      "Delivery tracking",
    ],
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path
          fillRule="evenodd"
          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Scale & Expand",
    time: "November 2025",
    description: "Expansion and advanced features",
    details: [
      "Expanded zip code coverage in Houston",
      "Partner integrations",
      "Mobile app launch",
    ],
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

const Roadmap: React.FC = () => {
  return (
    <section
      id="roadmap"
      className="py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Our Roadmap
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Here's what to expect as we build the future of stress-free selling.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-treasure-500 via-treasure-400 to-treasure-500 transform -translate-y-1/2 z-0" />

          {/* Timeline phases */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {roadmapData.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {/* Phase card */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Icon and timeline dot */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-treasure-500 rounded-full flex items-center justify-center text-gray-900 shadow-lg">
                        {phase.icon}
                      </div>
                      {/* Timeline dot */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-treasure-500 rounded-full border-4 border-white shadow-md" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {phase.title}
                    </h3>
                    <p className="text-treasure-600 font-semibold mb-3">
                      {phase.time}
                    </p>
                    <p className="text-gray-600 mb-4">{phase.description}</p>

                    {/* Details list */}
                    <ul className="text-left space-y-2">
                      {phase.details.map((detail, detailIndex) => (
                        <li
                          key={detailIndex}
                          className="flex items-start text-sm text-gray-600"
                        >
                          <span className="text-treasure-500 mr-2 mt-1">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
