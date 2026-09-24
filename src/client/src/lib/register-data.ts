export interface RegisterData {
  firstname: string,
  lastname: string,
  email: string;
  password: string;
  confirm: string;
}

export function parseRegisterData(formData: FormData): RegisterData {
  const firstname = formData.get("firstname");
  const lastname = formData.get("lastname");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirm = formData.get("confirm");

  if (
    typeof firstname !== "string" ||
    typeof lastname !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirm !== "string"
  ) {
    throw new Error("Données invalides");
  }

  return { firstname, lastname, email, password, confirm };
}