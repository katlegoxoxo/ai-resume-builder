import { ResumeData, TemplateId, TemplateStyle } from './types';

export const INITIAL_RESUME_DATA: ResumeData = {
  personalInfo: {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "123-456-7890",
    linkedin: "linkedin.com/in/janedoe",
    website: "janedoe.dev",
    address: "San Francisco, CA",
  },
  summary: "Highly motivated Senior Software Engineer with over 8 years of experience in building scalable web applications. Proficient in React, Node.js, and cloud technologies. Seeking to leverage expertise in a challenging role.",
  workExperience: [
    {
      id: "work1",
      jobTitle: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      location: "San Francisco, CA",
      startDate: "Jan 2018",
      endDate: "Present",
      isCurrent: true,
      description: [
        "Led a team of 5 engineers to develop and launch a new SaaS platform, resulting in a 30% increase in user engagement.",
        "Architected and implemented a microservices-based backend using Node.js and Docker, improving system scalability and reducing latency by 40%.",
        "Mentored junior developers and conducted code reviews to maintain high code quality standards."
      ]
    },
    {
      id: "work2",
      jobTitle: "Software Engineer",
      company: "Innovate LLC",
      location: "Palo Alto, CA",
      startDate: "Jun 2015",
      endDate: "Dec 2017",
      isCurrent: false,
      description: [
        "Developed and maintained frontend components using React and Redux.",
        "Collaborated with UX/UI designers to create intuitive and responsive user interfaces.",
        "Wrote unit and integration tests, increasing code coverage by 25%."
      ]
    }
  ],
  education: [
    {
      id: "edu1",
      institution: "State University",
      degree: "Master of Science",
      fieldOfStudy: "Computer Science",
      startDate: "2013",
      endDate: "2015"
    }
  ],
  skills: [
    { id: 'skill1', name: 'React' },
    { id: 'skill2', name: 'TypeScript' },
    { id: 'skill3', name: 'Node.js' },
    { id: 'skill4', name: 'AWS' },
    { id: 'skill5', name: 'Docker' },
    { id: 'skill6', name: 'SQL & NoSQL' },
  ],
  projects: [
    {
      id: "proj1",
      name: "Portfolio Website",
      description: "Personal portfolio built with Next.js and Tailwind CSS, deployed on Vercel.",
      url: "janedoe.dev"
    }
  ]
};

export const TEMPLATES = [
    { id: TemplateId.MODERN, name: 'Modern' },
    { id: TemplateId.PROFESSIONAL, name: 'Professional' },
    { id: TemplateId.CREATIVE, name: 'Creative' },
];

export const FONT_OPTIONS = [
    { id: 'font-sans', name: 'Inter (Sans-serif)'},
    { id: 'font-serif', name: 'Lora (Serif)' },
    { id: 'font-mono', name: 'Roboto Mono (Monospace)' },
    { id: 'font-roboto', name: 'Roboto (Sans-serif)' },
    { id: 'font-open-sans', name: 'Open Sans (Sans-serif)' },
    { id: 'font-lato', name: 'Lato (Sans-serif)' },
    { id: 'font-merriweather', name: 'Merriweather (Serif)' },
    { id: 'font-playfair-display', name: 'Playfair Display (Serif)' },
    { id: 'font-montserrat', name: 'Montserrat (Sans-serif)' },
    { id: 'font-nunito', name: 'Nunito (Sans-serif)' },
    { id: 'font-raleway', name: 'Raleway (Sans-serif)' },
];

export const COLOR_OPTIONS = [
    { id: 'blue', name: 'Blue', hex: '#2563eb'},
    { id: 'green', name: 'Green', hex: '#10b981' },
    { id: 'gray', name: 'Gray', hex: '#4b5563' },
    { id: 'purple', name: 'Purple', hex: '#7c3aed' },
];

export const INITIAL_STYLE: TemplateStyle = {
    fontFamily: FONT_OPTIONS[0].id,
    primaryColor: COLOR_OPTIONS[0].hex,
};