export interface ConfigurationBlock {
  /**
   * The identity service url
   */
  identityUrl: string;

  /**
   * The notification service url
   */
  nsUrl: string;

  /**
   * The queue service url
   */
  qsUrl: string;

  /**
   * The file service url
   */
  fsUrl: string;

  /**
   * The serverless functions service url
   */
  sfUrl: string;

  /**
   * The state machine service url
   */
  smUrl: string;

  /**
   * Toggle to allow consumption of self signed certificates
   */
  allowSelfSignCert: boolean;
}

export interface ConfigurationData {
  internal: ConfigurationBlock;
  external: ConfigurationBlock;
}
