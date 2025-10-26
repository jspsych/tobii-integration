import { JsPsych, JsPsychExtension, JsPsychExtensionInfo, ParameterType } from "jspsych";

import { version } from "../package.json";

interface InitializeParameters {}

interface OnStartParameters {}

interface OnLoadParameters {}

interface OnFinishParameters {}

/**
 * **extension-extension-tobii**
 *
 * jsPsych extension for Tobii eye tracker integration via WebSocket
 *
 * @author jsPsych Team
 * @see {@link http://local_proxy@127.0.0.1:24927/git/jspsych/tobii-integration/tree/main/packages/extension-extension-tobii/README.md}}
 */
class ExtensionTobiiExtension implements JsPsychExtension {
  static info: JsPsychExtensionInfo = {
    name: "extension-extension-tobii",
    version: version,
    data: {
      /** Provide a clear description of the data1 that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
      data1: {
        type: ParameterType.INT,
      },
      /** Provide a clear description of the data2 that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
      data2: {
        type: ParameterType.STRING,
      },
    },
    // When you run build on your extension, citations will be generated here based on the information in the CITATION.cff file.
    citations: '__CITATIONS__',
  };

  constructor(private jsPsych: JsPsych) {}

  initialize = ({}: InitializeParameters): Promise<void> => {
    return new Promise((resolve, reject) => {
      resolve();
    });
  };

  on_start = ({}: OnStartParameters): void => {};

  on_load = ({}: OnLoadParameters): void => {};

  on_finish = ({}: OnFinishParameters): { [key: string]: any } => {
    return {
      data1: 99, // Make sure this type and name matches the information for data1 in the data object contained within the info const.
      data2: "hello world!", // Make sure this type and name matches the information for data2 in the data object contained within the info const.
    };
  };
}

export default ExtensionTobiiExtension;
