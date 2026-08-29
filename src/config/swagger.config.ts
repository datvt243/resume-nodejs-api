/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: OpenAPI/Swagger spec generation config
 */

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// swagger-jsdoc reads route files at runtime; resolve the right extension
// whether running via ts-node (dev, .ts) or the compiled build (prod, .js)
const ext = __filename.endsWith('.ts') ? 'ts' : 'js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Resume API',
      version: '1.0.0',
      description: 'REST API for managing candidate CVs/resumes with auth, PDF export, and Redis caching.',
    },
    servers: [{ url: '/', description: 'Current server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { nullable: true },
            data: { nullable: true },
          },
        },
        SocialMedia: {
          type: 'object',
          properties: {
            github: { type: 'string' },
            linkedin: { type: 'string' },
            website: { type: 'string' },
          },
        },
        Candidate: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            gender: { type: 'boolean' },
            marital: { type: 'boolean' },
            birthday: { type: 'number', description: 'Unix timestamp' },
            address: { type: 'string' },
            phone: { type: 'string' },
            introduction: { type: 'string' },
            socialMedia: { $ref: '#/components/schemas/SocialMedia' },
          },
        },
        AuthRegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        AuthLoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        AuthTokenResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                tokenRefresh: { type: 'string' },
                user: { $ref: '#/components/schemas/Candidate' },
              },
            },
          },
        },
        Experience: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            company: { type: 'string' },
            position: { type: 'string' },
            startDate: { type: 'number' },
            endDate: { type: 'number' },
            isCurrent: { type: 'boolean' },
            description: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
          },
        },
        Education: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            school: { type: 'string' },
            major: { type: 'string' },
            startDate: { type: 'number' },
            endDate: { type: 'number' },
            isCurrent: { type: 'boolean' },
            description: { type: 'string' },
          },
        },
        Award: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            name: { type: 'string' },
            organization: { type: 'string' },
            issueDate: { type: 'number' },
            link: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
          },
        },
        Certificate: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            name: { type: 'string' },
            organization: { type: 'string' },
            description: { type: 'string' },
            startDate: { type: 'number' },
            endDate: { type: 'number' },
            isNoExpiration: { type: 'boolean' },
            link: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            position: { type: 'string' },
            technology: { type: 'array', items: { type: 'string' } },
            images: { type: 'array', items: { type: 'string' } },
            link: { type: 'string' },
            isWorking: { type: 'boolean' },
            startDate: { type: 'number' },
            endDate: { type: 'number' },
          },
        },
        Reference: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            company: { type: 'string' },
            position: { type: 'string' },
          },
        },
        GeneralInformation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            positionDesired: { type: 'string' },
            career: { type: 'string' },
            levelCurrent: { type: 'string' },
            levelDesired: { type: 'string' },
            salaryDesired: { type: 'number' },
            education: { type: 'string' },
            yearsOfExperience: { type: 'number' },
            workLocation: { type: 'string' },
            workForm: { type: 'string' },
            openToWork: { type: 'boolean' },
            careerGoal: { type: 'string' },
            personalSkills: { type: 'array', items: { type: 'object' } },
            professionalSkills: { type: 'array', items: { type: 'object' } },
            professionalSkillsGroup: { type: 'array', items: { type: 'string' } },
            foreignLanguages: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, `../routers/**/*.${ext}`),
    path.join(__dirname, `../candidate_me/*.${ext}`),
    path.join(__dirname, `../server.${ext}`),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
