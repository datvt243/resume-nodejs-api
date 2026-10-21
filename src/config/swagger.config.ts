/**
 * OpenAPI/Swagger spec generation config
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { ErrorCode } from '@/errors/AppError';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { CAREER_BREAK_TYPES } from '@/models/experience.model';

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
          description: 'The JWT access token issued by POST /auth/login (same token as everywhere else in this API), sent as `Authorization: Bearer <token>`. Also accepted via an httpOnly cookie on routes that support it — see each route\'s own description.',
        },
        /**
         * Same JWT access token as bearerAuth, just read from a query
         * string field instead of a header — exists ONLY for
         * GET /api/v1/download-pdf, where a browser-navigated download
         * (<a href>, new tab, <iframe>) can't attach a custom
         * Authorization header. Goes through the exact same verifyToken
         * middleware (blacklist + session-revocation checks included) as
         * every bearerAuth-only route; it's a different transport for
         * the same credential, not a weaker one. Caveat: a token in the
         * URL ends up in server access logs and browser history, which
         * is why every other authenticated route still requires the
         * header/cookie instead.
         */
        queryTokenAuth: {
          type: 'apiKey',
          in: 'query',
          name: 'token',
          description: 'Same JWT access token as `bearerAuth`, passed as `?token=` instead of an Authorization header — used only by GET /api/v1/download-pdf, for direct-link/browser-navigated downloads that cannot set a custom header. Goes through the identical verifyToken checks (signature, blacklist, session-revocation). Caveat: a token in the URL is exposed in access logs and browser history.',
        },
      },
      parameters: {
        /**
         * Pagination — shared by every CV-section `GET /` list endpoint
         * via BaseController.baseGetAll. All three are optional; `data` is
         * always an array and `meta` describes it (see Pagination).
         */
        PageParam: {
          in: 'query',
          name: 'page',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: '1-indexed page number. Ignored unless `limit` is also given.',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100 },
          description: 'Page size (max 100). Without it the whole list comes back as one page; `data` is an array either way.',
        },
        SortParam: {
          in: 'query',
          name: 'sort',
          required: false,
          schema: { type: 'string' },
          description: "Mongoose sort expression, e.g. `startDate` or `-createdAt` for descending. Invalid values are silently ignored.",
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          description: 'Success envelope. List endpoints also carry `meta`.',
          properties: {
            success: { type: 'boolean', enum: [true] },
            message: { type: 'string' },
            data: { nullable: true },
            meta: { $ref: '#/components/schemas/Pagination' },
          },
        },
        ErrorResponse: {
          type: 'object',
          description: 'Error envelope, used by every 4xx/5xx JSON response (see API-STANDARD.md §1, §3).',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', enum: Object.values(ErrorCode) },
                message: { type: 'string', description: 'Localized, safe to show to users' },
                details: {
                  type: 'array',
                  description: 'Validation errors only, one entry per failing field',
                  items: {
                    type: 'object',
                    properties: { field: { type: 'string', example: 'items.3.company' }, message: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
        // `meta` of every list response; without `?limit=` it is one page holding the whole list.
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
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
            cvFile: {
              type: 'object',
              properties: {
                originalName: { type: 'string' },
                uploadedAt: { type: 'number', description: 'Unix timestamp (ms)' },
              },
            },
            isPublic: { type: 'boolean', description: 'Whether GET /api/me/:email serves this profile publicly. Default true.' },
            emailVerified: { type: 'boolean', description: 'Set via GET /auth/verify-email. Does not block login. Default false.' },
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
            isCareerBreak: { type: 'boolean', description: 'LinkedIn-style career break; company/position may be empty' },
            careerBreakType: { type: 'string', enum: CAREER_BREAK_TYPES, description: 'Required when isCareerBreak is true' },
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
        Application: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            company: { type: 'string' },
            position: { type: 'string' },
            appliedDate: { type: 'number' },
            status: { type: 'string', enum: ['applied', 'interview', 'offer', 'rejected'] },
            note: { type: 'string' },
            jobLink: { type: 'string' },
            profileId: {
              type: 'string',
              nullable: true,
              description:
                "CV profile sent with this application: one of the candidate's own non-deleted profiles (anything else → 400). null or '' unlinks; omit on update to keep the current link. Kept if the profile is deleted later.",
            },
          },
        },
        Visit: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            ip: { type: 'string' },
            location: { type: 'string', description: 'Derived from IP via offline geoip-lite lookup; empty when the lookup has no match' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Profile: {
          type: 'object',
          description:
            'A named subset of the candidate\'s own Education/Experience/Project/Certificate/Award/Reference entries, selectable via ?profile= on GET /api/me/{email}. A "Tổng hợp" (All) profile is synthesized automatically on first GET /api/v1/profile if the candidate has none yet.',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            name: { type: 'string' },
            educationIds: { type: 'array', items: { type: 'string' } },
            experienceIds: { type: 'array', items: { type: 'string' } },
            projectIds: { type: 'array', items: { type: 'string' } },
            certificateIds: { type: 'array', items: { type: 'string' } },
            awardIds: { type: 'array', items: { type: 'string' } },
            referenceIds: { type: 'array', items: { type: 'string' } },
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
