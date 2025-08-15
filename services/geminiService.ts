

import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, JobAnalysisResult, ATSCheckResult } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const resumeParserSchema = {
    type: Type.OBJECT,
    properties: {
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                linkedin: { type: Type.STRING, description: "Full LinkedIn URL, if available." },
                website: { type: Type.STRING, description: "Personal website or portfolio URL." },
                address: { type: Type.STRING, description: "City and State, e.g., 'San Francisco, CA'." },
            },
        },
        summary: { type: Type.STRING, description: "A professional summary of 2-4 sentences." },
        workExperience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier like work-1" },
                    jobTitle: { type: Type.STRING },
                    company: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    isCurrent: { type: Type.BOOLEAN, description: "True if this is the current job (e.g., end date is 'Present')." },
                    description: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of strings for achievements/responsibilities." }
                },
            }
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier like edu-1" },
                    institution: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    fieldOfStudy: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                },
            }
        },
        skills: {
            type: Type.ARRAY,
            description: "A list of professional skills.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier like skill-1" },
                    name: { type: Type.STRING }
                },
            }
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier like proj-1" },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    url: { type: Type.STRING, description: "A URL to the project, if available." }
                },
            }
        },
    },
    required: ["personalInfo", "summary", "workExperience", "education", "skills"]
};


const jobAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        matchScore: { type: Type.INTEGER, description: "A score from 0 to 100 representing how well the resume matches the job description." },
        keywordGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords present in the job description but missing from the resume." },
        improvementSuggestions: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "Specific suggestions to improve the resume summary." },
                experience: { type: Type.STRING, description: "Suggestions for improving the work experience section to better align with the job description." }
            }
        },
        missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of key skills mentioned in the job description that are not on the resume." }
    },
    required: ["matchScore", "keywordGaps", "improvementSuggestions", "missingSkills"],
};

const atsCheckSchema = {
    type: Type.OBJECT,
    properties: {
        atsScore: { type: Type.INTEGER, description: "A score from 0 to 100 for ATS compatibility." },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable suggestions to improve the ATS score." }
    },
    required: ["atsScore", "suggestions"],
};

export const parseResume = async (file: { data: string; mimeType: string; }): Promise<ResumeData> => {
    try {
        const filePart = {
            inlineData: {
                data: file.data,
                mimeType: file.mimeType,
            },
        };
        const prompt = `
            You are an expert resume parser. Analyze the provided resume document.
            Extract all information and structure it precisely according to the JSON schema.
            Generate a unique ID for each item in the arrays (e.g., 'work-1', 'edu-1').
            If a value is not found, use an empty string or an empty array.
            For work experience, infer if it's the current job based on dates like 'Present'.
            The descriptions for work experience should be an array of strings, where each string is a bullet point from the resume.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [filePart, {text: prompt}] },
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeParserSchema,
            }
        });

        const jsonString = response.text;
        // The result from the API with a response schema is inferred as a readonly type.
        // We perform a deep clone to make it mutable for our app's state.
        const parsedResult = JSON.parse(jsonString);
        const mutableResult: ResumeData = JSON.parse(JSON.stringify(parsedResult));
        return mutableResult;
    } catch (error) {
        console.error("Error parsing resume:", error);
        throw new Error("Failed to parse the resume. The file might be corrupted or in an unsupported format.");
    }
};

export const generateSmartSuggestions = async (jobTitle: string, company: string): Promise<string[]> => {
    try {
        const prompt = `Generate 3-5 impactful, one-sentence resume bullet points for a "${jobTitle}" at "${company}". Focus on achievements and metrics. Return a JSON array of strings.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const jsonString = response.text;
        const parsedResult = JSON.parse(jsonString);
        return JSON.parse(JSON.stringify(parsedResult));
    } catch (error) {
        console.error("Error generating smart suggestions:", error);
        throw new Error("Failed to get suggestions from AI.");
    }
};

export const analyzeJobDescription = async (resumeData: ResumeData, jobDescription: string): Promise<JobAnalysisResult> => {
    try {
        const resumeText = `
            Summary: ${resumeData.summary}
            Experience: ${resumeData.workExperience.map(w => `${w.jobTitle} - ${w.description.join(', ')}`).join('; ')}
            Skills: ${resumeData.skills.map(s => s.name).join(', ')}
        `;

        const prompt = `
            You are an expert ATS and recruitment specialist.
            Analyze the following resume against the provided job description.
            Resume: ${resumeText}
            Job Description: ${jobDescription}
            Provide a detailed analysis based on the required JSON schema.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: jobAnalysisSchema,
            }
        });

        const jsonString = response.text;
        const parsedResult = JSON.parse(jsonString);
        // The return type is already readonly, so no need to deep clone for mutability.
        return parsedResult;
    } catch (error) {
        console.error("Error analyzing job description:", error);
        throw new Error("Failed to analyze job description.");
    }
};

export const checkATSCompatibility = async (resumeData: ResumeData): Promise<ATSCheckResult> => {
    try {
        const resumeText = `
            Name: ${resumeData.personalInfo.name}
            Summary: ${resumeData.summary}
            Experience Titles: ${resumeData.workExperience.map(w => w.jobTitle).join(', ')}
            Education Degrees: ${resumeData.education.map(e => e.degree).join(', ')}
            Skills: ${resumeData.skills.map(s => s.name).join(', ')}
        `;
        
        const prompt = `
            You are an ATS simulator. Analyze this resume data for ATS compatibility. 
            Check for standard section titles, keyword relevance for a general professional role, and clarity. 
            Do not critique the content's quality, only its parsability and structure.
            Resume Data: ${resumeText}
            Provide a score and suggestions based on the JSON schema.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: atsCheckSchema,
            }
        });

        const jsonString = response.text;
        const parsedResult = JSON.parse(jsonString);
        // The return type is already readonly, so no need to deep clone for mutability.
        return parsedResult;
    } catch (error) {
        console.error("Error checking ATS compatibility:", error);
        throw new Error("Failed to check ATS compatibility.");
    }
};

export const generateCoverLetter = async (resumeData: ResumeData, jobDescription: string): Promise<string> => {
    try {
        const resumeText = `
            Name: ${resumeData.personalInfo.name}
            Email: ${resumeData.personalInfo.email}
            Phone: ${resumeData.personalInfo.phone}
            LinkedIn: ${resumeData.personalInfo.linkedin}
            Website: ${resumeData.personalInfo.website}
            Address: ${resumeData.personalInfo.address}

            Summary: ${resumeData.summary}

            Work Experience:
            ${resumeData.workExperience.map(w => `
- Job Title: ${w.jobTitle} at ${w.company} (${w.startDate} - ${w.isCurrent ? 'Present' : w.endDate})
  Achievements: ${w.description.join('; ')}
            `).join('')}

            Education:
            ${resumeData.education.map(e => `- ${e.degree} in ${e.fieldOfStudy} from ${e.institution}`).join('\n')}

            Skills: ${resumeData.skills.map(s => s.name).join(', ')}
            
            Projects:
            ${resumeData.projects.map(p => `- ${p.name}: ${p.description}`).join('\n')}
        `;

        const prompt = `
            You are a professional career coach and expert cover letter writer.
            Based on the following resume and job description, write a compelling, professional, and personalized cover letter.
            The cover letter should be three to four paragraphs long.
            - The first paragraph should introduce the applicant and the position they are applying for, with a strong hook.
            - The body paragraphs (1-2) must connect the applicant's experience and skills from their resume directly to the key requirements in the job description. Highlight 2-3 specific achievements that are most relevant.
            - The final paragraph should reiterate interest in the role and include a strong call to action.
            - Address it to "Hiring Manager" if no specific name is available.
            - Use the applicant's name, which is provided in the resume.

            Here is the user's resume:
            ---
            ${resumeText}
            ---

            Here is the job description:
            ---
            ${jobDescription}
            ---

            Return ONLY the full text of the cover letter. Do not include any extra commentary or introductory phrases like "Here is the cover letter:".
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error generating cover letter:", error);
        throw new Error("Failed to generate the cover letter. Please try again.");
    }
};
