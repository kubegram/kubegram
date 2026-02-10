--
-- PostgreSQL database dump
--

\restrict MV6gRpQ6EfUCEiKxNj2dRwZIDNpXhcQujGydLgVG6Hwzqgacvaysm67mhYsjl8r

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

-- Started on 2026-02-09 04:31:35 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 214 (class 1259 OID 16389)
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    tokens integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


--
-- TOC entry 216 (class 1259 OID 16401)
-- Name: company_certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_certificates (
    id integer NOT NULL,
    company_id uuid,
    public_key_url text NOT NULL,
    encrypted_private_key text,
    fingerprint text NOT NULL,
    label text,
    created_at timestamp without time zone DEFAULT now(),
    invalidated_at timestamp without time zone
);


--
-- TOC entry 215 (class 1259 OID 16400)
-- Name: company_certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_certificates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3550 (class 0 OID 0)
-- Dependencies: 215
-- Name: company_certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_certificates_id_seq OWNED BY public.company_certificates.id;


--
-- TOC entry 218 (class 1259 OID 16411)
-- Name: company_llm_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_llm_tokens (
    id integer NOT NULL,
    company_id uuid,
    provider text NOT NULL,
    provider_api_url text,
    encrypted_token_url text,
    models text,
    encryption_key_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 217 (class 1259 OID 16410)
-- Name: company_llm_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_llm_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3551 (class 0 OID 0)
-- Dependencies: 217
-- Name: company_llm_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_llm_tokens_id_seq OWNED BY public.company_llm_tokens.id;


--
-- TOC entry 220 (class 1259 OID 16422)
-- Name: generation_job_artifacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generation_job_artifacts (
    id integer NOT NULL,
    job_id integer NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    content text,
    storage_url text,
    size integer,
    checksum text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 219 (class 1259 OID 16421)
-- Name: generation_job_artifacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.generation_job_artifacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 219
-- Name: generation_job_artifacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.generation_job_artifacts_id_seq OWNED BY public.generation_job_artifacts.id;


--
-- TOC entry 222 (class 1259 OID 16432)
-- Name: generation_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generation_jobs (
    id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    graph_id text NOT NULL,
    project_id integer NOT NULL,
    requested_by integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    config text NOT NULL,
    result_data text,
    error_message text,
    progress integer DEFAULT 0 NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 221 (class 1259 OID 16431)
-- Name: generation_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.generation_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 221
-- Name: generation_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.generation_jobs_id_seq OWNED BY public.generation_jobs.id;


--
-- TOC entry 223 (class 1259 OID 16447)
-- Name: openauth_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.openauth_codes (
    id text NOT NULL,
    subject text NOT NULL,
    client_id text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 224 (class 1259 OID 16455)
-- Name: openauth_kv; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.openauth_kv (
    key text NOT NULL,
    value text,
    expiry timestamp without time zone
);


--
-- TOC entry 225 (class 1259 OID 16462)
-- Name: openauth_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.openauth_sessions (
    id text NOT NULL,
    subject text NOT NULL,
    provider text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 227 (class 1259 OID 16472)
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name text NOT NULL,
    company_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


--
-- TOC entry 226 (class 1259 OID 16471)
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 226
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- TOC entry 229 (class 1259 OID 16483)
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name text NOT NULL,
    graph_id text,
    graph_meta text,
    team_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


--
-- TOC entry 228 (class 1259 OID 16482)
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 228
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- TOC entry 231 (class 1259 OID 16494)
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name text NOT NULL,
    organization_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


--
-- TOC entry 230 (class 1259 OID 16493)
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 230
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- TOC entry 233 (class 1259 OID 16505)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    avatar_url text,
    role text DEFAULT 'team_member'::text,
    provider text,
    provider_id text,
    team_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


--
-- TOC entry 232 (class 1259 OID 16504)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 232
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3315 (class 2604 OID 16404)
-- Name: company_certificates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_certificates ALTER COLUMN id SET DEFAULT nextval('public.company_certificates_id_seq'::regclass);


--
-- TOC entry 3317 (class 2604 OID 16414)
-- Name: company_llm_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_llm_tokens ALTER COLUMN id SET DEFAULT nextval('public.company_llm_tokens_id_seq'::regclass);


--
-- TOC entry 3320 (class 2604 OID 16425)
-- Name: generation_job_artifacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_job_artifacts ALTER COLUMN id SET DEFAULT nextval('public.generation_job_artifacts_id_seq'::regclass);


--
-- TOC entry 3322 (class 2604 OID 16435)
-- Name: generation_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_jobs ALTER COLUMN id SET DEFAULT nextval('public.generation_jobs_id_seq'::regclass);


--
-- TOC entry 3331 (class 2604 OID 16475)
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- TOC entry 3334 (class 2604 OID 16486)
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- TOC entry 3337 (class 2604 OID 16497)
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- TOC entry 3340 (class 2604 OID 16508)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3525 (class 0 OID 16389)
-- Dependencies: 214
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, tokens, created_at, updated_at, deleted_at) FROM stdin;
f79a3ca0-2c5a-4e2e-88e7-61d5236a0adc	company-saleh-shehata-676580e5-36f6-47b1-b4bc-2b0431307d7d	0	2026-02-09 03:40:23.788648	2026-02-09 03:40:23.788648	\N
\.


--
-- TOC entry 3527 (class 0 OID 16401)
-- Dependencies: 216
-- Data for Name: company_certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_certificates (id, company_id, public_key_url, encrypted_private_key, fingerprint, label, created_at, invalidated_at) FROM stdin;
\.


--
-- TOC entry 3529 (class 0 OID 16411)
-- Dependencies: 218
-- Data for Name: company_llm_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_llm_tokens (id, company_id, provider, provider_api_url, encrypted_token_url, models, encryption_key_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3531 (class 0 OID 16422)
-- Dependencies: 220
-- Data for Name: generation_job_artifacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.generation_job_artifacts (id, job_id, type, name, content, storage_url, size, checksum, created_at) FROM stdin;
\.


--
-- TOC entry 3533 (class 0 OID 16432)
-- Dependencies: 222
-- Data for Name: generation_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.generation_jobs (id, uuid, graph_id, project_id, requested_by, status, config, result_data, error_message, progress, started_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3534 (class 0 OID 16447)
-- Dependencies: 223
-- Data for Name: openauth_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.openauth_codes (id, subject, client_id, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 3535 (class 0 OID 16455)
-- Dependencies: 224
-- Data for Name: openauth_kv; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.openauth_kv (key, value, expiry) FROM stdin;
signing:key:dceebc8f-cb56-45f0-ac45-0410f0247131	{"id":"dceebc8f-cb56-45f0-ac45-0410f0247131","publicKey":"-----BEGIN PUBLIC KEY-----\\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEXumFVjz9vadtNzUkdpPef7ncx79\\nctk3+eihSmk/irDQn+JLJSaW8Nv75/JkNnaTNlGaTdBdS6y0Ch4pflSYhA==\\n-----END PUBLIC KEY-----","privateKey":"-----BEGIN PRIVATE KEY-----\\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgibzZy3SNPIhRHCW/\\n3cpQ6IKjmk9o/ZRxQ5xXUHKnO8ahRANCAAQRe6YVWPP29p203NSR2k95/udzHv1y\\n2Tf56KFKaT+KsNCf4kslJpbw2/vn8mQ2dpM2UZpN0F1LrLQKHil+VJiE\\n-----END PRIVATE KEY-----","created":1770608410157,"alg":"ES256"}	\N
encryption:key:43684ff8-8155-4618-ac06-17cff1facad9	{"id":"43684ff8-8155-4618-ac06-17cff1facad9","publicKey":"-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4SCkk3IrAdxnV4xQzYlb\\nPGKk/hbzuMCj0bBN5FzyLso2KPMRrkB45357RqKAcbtv70NBBL5AEOKjTP0P+gpo\\nBZChiLlMzKeAVjcZ3GyckVuV9ayaNQOwfmbZ8T6iBi9NAAol+VDoYT21PHrhn3Sk\\nRDYqxiTDsi4IsMKwWApdz0ZQEusbQHMM7JQNU1D7f60ckRZLBQeXA+s8b7zCXUNX\\nvchtpe1A9J69hPkIemrGXSIkajQ18oC0N20ygJikAUtw8Kavp+xLs9DWMC/aEpvK\\n3zy2uXtarGXsj5DQTIFeF8FuOA9pGlB8EotJAnq8HzmoshdpzJ7DV7d0scIUik4a\\nVwIDAQAB\\n-----END PUBLIC KEY-----","privateKey":"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDhIKSTcisB3GdX\\njFDNiVs8YqT+FvO4wKPRsE3kXPIuyjYo8xGuQHjnfntGooBxu2/vQ0EEvkAQ4qNM\\n/Q/6CmgFkKGIuUzMp4BWNxncbJyRW5X1rJo1A7B+ZtnxPqIGL00ACiX5UOhhPbU8\\neuGfdKRENirGJMOyLgiwwrBYCl3PRlAS6xtAcwzslA1TUPt/rRyRFksFB5cD6zxv\\nvMJdQ1e9yG2l7UD0nr2E+Qh6asZdIiRqNDXygLQ3bTKAmKQBS3Dwpq+n7Euz0NYw\\nL9oSm8rfPLa5e1qsZeyPkNBMgV4XwW44D2kaUHwSi0kCerwfOaiyF2nMnsNXt3Sx\\nwhSKThpXAgMBAAECggEAFsQp0H1dqwkCbGCUtUxcLR2eqNFiYT8d8fEd12es2B17\\n36VBFvmPIH3ycoCxc47scWpAM34X1X1N3VXEHVmbDmEDbOOsSA/yUwWseFWFec+k\\nuRz01UKjwQyeop5eXTjAVS4xi+ZqMZc/cjfNBEaT7A/8QGBsZ+Lu3w05LxYRSYoW\\nrs4saf/t2oVP/+zilrPbKpWe/bg+sc0FBNuSphrefvxmIvXhdMlb5qnIzDYsWQKh\\nca+wzzkbaDJZ57+CqChmqsg/dLBx5RwL69eGQUAU8Q+Fl5z1Zd1uaEZGGf+7+c5D\\n471Mcs4wOBN2ucRCNn57paAav/gk6skEBbM5JYhA0QKBgQD4R1+gLY3FTlBw5XMH\\nSEsAvLvKBJ2ey5K3ICxL9jXyzMxm5QApDaD1gsWg/4lti3V2iix3+lbJrFg8S6N/\\nESyhFRhF6z8PIzVY5FpWwoQCmPnbmZn+5OMgwK4msGJ5yYdW9mrURTX28LSWS5RL\\ncE96AZwqIiNYzsKLzTd4yeO0ZwKBgQDoIPRdHKes61Z1z/bs/V4inF87mFz5lu9T\\nxshk4NyV1E7ba2y9Qfv1ZPZz0ktMX8O40EjZEcvCDO+HP0Y04mfS2Bo7vBnkEYbr\\nXjQHgL/04hB2Ej43nK4k838qEo6j+IsGqn0KGYuUg8odBrQ517J/B3qYy3RLOweJ\\nDQ02RNA0kQKBgFtylpM+FCjnZpOev9af1xhna9fGCXRy0RBoZkh4YHiU3HjNwlhc\\nr7ueNkLNvIW/xz0pOaXbbFoOA9X5mjf0UHboeS9PrcNamYyrV2b7cHowdF9hXSpY\\njhwDPGH9t9fZ1eK/Eqwq7eyNzkZJgk6jCHMM4sNWHaTZSykJJnR0EE3jAoGAMgI/\\ngvvUZ91/j/wQv3fKWvyDS8yEY0UQJGVT8N+8xg6qOn1HPPLFPFXW/pbUoAyVlvBQ\\ncWtzEUhGJkYMcwI/yd3CsRHSJh9ciMKPxPoI4NH/J+DARKzdm5pV0BOVZV/7W6FJ\\nNO7R8ln+Jgi2tStyCgnrcJWMZVS/R9hm+0UR8fECgYBdY4jW5FbNo6+6cw9yC90L\\nWQ3dj0CluZQikPmiNlOFhro2en3GfKrzGToCl1Ji38NPcr84zpgnJDiJz2H7cofb\\ntyl9vWnxDhfWfI0wWPWTnzK75FD9e3vI+v8vy6rRJy15TNiwSKloqm7V7MOX7BSJ\\nzwfjpsnV5ZMpuwAuDce+XQ==\\n-----END PRIVATE KEY-----","created":1770608411604,"alg":"RSA-OAEP-512"}	\N
oauth:refresh:user:aaa49a0c23e83921:87bfce3e-4ca0-4110-82ff-82b2e44a0f0f	{"type":"user","properties":{"id":"1","provider":"google"},"subject":"user:aaa49a0c23e83921","redirectURI":"http://localhost:5173/auth/callback","clientID":"kubegram-web","ttl":{"access":2592000,"refresh":31536000},"nextToken":"fc292c97-60ac-4f09-a241-952fa98fed98"}	2027-02-09 03:40:24.096
oauth:refresh:user:aaa49a0c23e83921:c90eded7-0e94-4e5b-adb2-8390fc13f860	{"type":"user","properties":{"id":"1","provider":"google"},"subject":"user:aaa49a0c23e83921","redirectURI":"http://localhost:5173/auth/callback","clientID":"kubegram-web","ttl":{"access":2592000,"refresh":31536000},"nextToken":"1cbf8a37-d2c1-4346-b1eb-193ac0428f0e"}	2027-02-09 03:40:24.097
oauth:refresh:user:aaa49a0c23e83921:f85cc69c-52c1-4b7f-8114-ec94be211d79	{"type":"user","properties":{"id":"1","provider":"google"},"subject":"user:aaa49a0c23e83921","redirectURI":"http://localhost:5173/auth/callback","clientID":"kubegram-web","ttl":{"access":2592000,"refresh":31536000},"nextToken":"9580d5ef-e5a7-4a0c-b2e5-aadc1c48b201"}	2027-02-09 03:41:18.596
oauth:refresh:user:aaa49a0c23e83921:41280851-6be6-4e60-b40d-5ca733826573	{"type":"user","properties":{"id":"1","provider":"google"},"subject":"user:aaa49a0c23e83921","redirectURI":"http://localhost:5173/auth/callback","clientID":"kubegram-web","ttl":{"access":2592000,"refresh":31536000},"nextToken":"bfc4efba-9fe2-4fe8-9024-114a869db7d4"}	2027-02-09 03:42:50.078
\.


--
-- TOC entry 3536 (class 0 OID 16462)
-- Dependencies: 225
-- Data for Name: openauth_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.openauth_sessions (id, subject, provider, access_token, refresh_token, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3538 (class 0 OID 16472)
-- Dependencies: 227
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, company_id, created_at, updated_at, deleted_at) FROM stdin;
1	org-saleh-shehata-676580e5-36f6-47b1-b4bc-2b0431307d7d	f79a3ca0-2c5a-4e2e-88e7-61d5236a0adc	2026-02-09 03:40:23.790492	2026-02-09 03:40:23.790492	\N
\.


--
-- TOC entry 3540 (class 0 OID 16483)
-- Dependencies: 229
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, graph_id, graph_meta, team_id, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 3542 (class 0 OID 16494)
-- Dependencies: 231
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, organization_id, created_at, updated_at, deleted_at) FROM stdin;
1	team-saleh-shehata-676580e5-36f6-47b1-b4bc-2b0431307d7d	1	2026-02-09 03:40:23.792904	2026-02-09 03:40:23.792904	\N
\.


--
-- TOC entry 3544 (class 0 OID 16505)
-- Dependencies: 233
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, avatar_url, role, provider, provider_id, team_id, created_at, updated_at, deleted_at) FROM stdin;
1	Saleh Shehata	saleh.shehata1995@gmail.com	https://lh3.googleusercontent.com/a/ACg8ocKZ0j6hcBSio0NhhB7-1If_SMm8eLeBnOiBiJ1NB3MH513pBVUk=s96-c	team_member	google	100761083866734777529	1	2026-02-09 03:40:23.782163	2026-02-09 03:42:49.821	\N
\.


--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 215
-- Name: company_certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_certificates_id_seq', 1, false);


--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 217
-- Name: company_llm_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_llm_tokens_id_seq', 1, false);


--
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 219
-- Name: generation_job_artifacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.generation_job_artifacts_id_seq', 1, false);


--
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 221
-- Name: generation_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.generation_jobs_id_seq', 1, false);


--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 226
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, true);


--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 228
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 230
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teams_id_seq', 1, true);


--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 232
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- TOC entry 3345 (class 2606 OID 16399)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- TOC entry 3347 (class 2606 OID 16409)
-- Name: company_certificates company_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_certificates
    ADD CONSTRAINT company_certificates_pkey PRIMARY KEY (id);


--
-- TOC entry 3349 (class 2606 OID 16420)
-- Name: company_llm_tokens company_llm_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_llm_tokens
    ADD CONSTRAINT company_llm_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3351 (class 2606 OID 16430)
-- Name: generation_job_artifacts generation_job_artifacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_job_artifacts
    ADD CONSTRAINT generation_job_artifacts_pkey PRIMARY KEY (id);


--
-- TOC entry 3353 (class 2606 OID 16444)
-- Name: generation_jobs generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_jobs
    ADD CONSTRAINT generation_jobs_pkey PRIMARY KEY (id);


--
-- TOC entry 3355 (class 2606 OID 16446)
-- Name: generation_jobs generation_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_jobs
    ADD CONSTRAINT generation_jobs_uuid_unique UNIQUE (uuid);


--
-- TOC entry 3357 (class 2606 OID 16454)
-- Name: openauth_codes openauth_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.openauth_codes
    ADD CONSTRAINT openauth_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 3359 (class 2606 OID 16461)
-- Name: openauth_kv openauth_kv_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.openauth_kv
    ADD CONSTRAINT openauth_kv_pkey PRIMARY KEY (key);


--
-- TOC entry 3361 (class 2606 OID 16470)
-- Name: openauth_sessions openauth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.openauth_sessions
    ADD CONSTRAINT openauth_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3363 (class 2606 OID 16481)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 3365 (class 2606 OID 16492)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 3367 (class 2606 OID 16503)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 3369 (class 2606 OID 16517)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3371 (class 2606 OID 16515)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3372 (class 2606 OID 16518)
-- Name: company_certificates company_certificates_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_certificates
    ADD CONSTRAINT company_certificates_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 3373 (class 2606 OID 16523)
-- Name: company_llm_tokens company_llm_tokens_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_llm_tokens
    ADD CONSTRAINT company_llm_tokens_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 3374 (class 2606 OID 16528)
-- Name: company_llm_tokens company_llm_tokens_encryption_key_id_company_certificates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_llm_tokens
    ADD CONSTRAINT company_llm_tokens_encryption_key_id_company_certificates_id_fk FOREIGN KEY (encryption_key_id) REFERENCES public.company_certificates(id);


--
-- TOC entry 3375 (class 2606 OID 16533)
-- Name: generation_job_artifacts generation_job_artifacts_job_id_generation_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_job_artifacts
    ADD CONSTRAINT generation_job_artifacts_job_id_generation_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.generation_jobs(id) ON DELETE CASCADE;


--
-- TOC entry 3376 (class 2606 OID 16538)
-- Name: generation_jobs generation_jobs_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_jobs
    ADD CONSTRAINT generation_jobs_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- TOC entry 3377 (class 2606 OID 16543)
-- Name: generation_jobs generation_jobs_requested_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_jobs
    ADD CONSTRAINT generation_jobs_requested_by_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- TOC entry 3378 (class 2606 OID 16548)
-- Name: organizations organizations_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 3379 (class 2606 OID 16558)
-- Name: projects projects_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3380 (class 2606 OID 16553)
-- Name: projects projects_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- TOC entry 3381 (class 2606 OID 16563)
-- Name: teams teams_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3382 (class 2606 OID 16568)
-- Name: users users_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


-- Completed on 2026-02-09 04:31:35 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict MV6gRpQ6EfUCEiKxNj2dRwZIDNpXhcQujGydLgVG6Hwzqgacvaysm67mhYsjl8r

