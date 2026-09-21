export class SMTPError extends Error {
  constructor(
    message: string,
    public kind: "temporary" | "permanent",
  ) {
    super(message);
    this.name = "SMTPError";
  }
}