export function getNumberEnvironmentVariable(environmentVariableName: string): number {
  return parseInt(getStringEnvironmentVariable(environmentVariableName), 10);
}

export function getStringEnvironmentVariable(environmentVariableName: string): string {
  const envVariable = process.env[environmentVariableName];
  if (!envVariable) {
    throw new Error(`The environment variable ${environmentVariableName} is not defined.`);
  }
  return envVariable;
}
