import "server-only";
import {neon} from "@neondatabase/serverless";
import {avatarConfigSchema} from "@/lib/profile-settings";
import {defaultAvatar,normalizeAvatar,type AvatarConfig} from "@/lib/avatar-config";

function client(){const url=process.env.DATABASE_URL;return url?neon(url):null;}
async function avatarReady(){const sql=client();if(!sql)return false;const rows=await sql`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='avatar_config') AS ready`;return rows[0]?.ready===true;}
export async function loadAccountAvatar(userId:string):Promise<AvatarConfig>{const sql=client();if(!sql)return defaultAvatar;try{if(!await avatarReady())return defaultAvatar;const rows=await sql`SELECT avatar_config FROM users WHERE id=${userId} LIMIT 1`;return normalizeAvatar(rows[0]?.avatar_config);}catch{return defaultAvatar;}}
export async function saveAccountAvatar(userId:string,raw:string){if(!raw)return false;let value:unknown;try{value=JSON.parse(raw);}catch{throw new Error("Please check your avatar choices and try again.");}const parsed=avatarConfigSchema.safeParse(value);if(!parsed.success)throw new Error("Please check your avatar choices and try again.");const sql=client();if(!sql||!await avatarReady())return false;await sql`UPDATE users SET avatar_config=CAST(${JSON.stringify(parsed.data)} AS jsonb),updated_at=now() WHERE id=${userId}`;return true;}
export async function selectAvatarAsProfilePicture(userId:string,enabled:boolean){if(!enabled)return;const sql=client();if(!sql)return;await sql`UPDATE users SET profile_photo=NULL,updated_at=now() WHERE id=${userId}`;}
