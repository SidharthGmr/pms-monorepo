// import { getServerSession } from "next-auth";
// import { options } from "@/app/api/auth/[...nextauth]/options";
// import { redirect } from "next/navigation";
// import { Roles } from "@/enums/roles.enum";
 

// export async function redirectAuthenticatedUser(): Promise<void> {
//     const session = await getServerSession(options);
//     if (session?.user) {
//         const user = session.user as UserDto;
//         if (user.roleName === Roles.ADMINISTRATOR) {
//             redirect('/admin');
//         }
//         if (user.roleName === Roles.AFFILIATE) {
//             redirect('/affiliate');
//         }
//         redirect('/dashboard');
//     }
// }