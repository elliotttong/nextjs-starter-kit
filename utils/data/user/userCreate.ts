"server only"

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { userCreateProps } from "@/utils/types";

export const userCreate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userCreateProps) => {
  console.log('Starting userCreate with:', {
    email,
    first_name,
    last_name,
    user_id
  });

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from("user")
      .select()
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('User already exists:', existingUser);
      return existingUser;
    }

    // Insert new user with created_time instead of created_at
    const { data, error } = await supabase
      .from("user")
      .insert([
        {
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
          // created_time will be set automatically by the default value
        },
      ])
      .select();

    console.log("Supabase insert result:", { data, error });

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('User was not created');
    }

    return data[0];
  } catch (error: any) {
    console.error("userCreate error:", error);
    throw error;
  }
};
