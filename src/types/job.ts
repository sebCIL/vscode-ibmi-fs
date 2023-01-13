import { getBase } from "../tools";
import * as vscode from 'vscode';
import Base from "./base";
import { Components } from "../webviewToolkit";

interface JobPropertie {
  jobName: string
  jobNameShort: string
  jobUser: string
  jobNumber: string
  jobStatus: string
  currentUser: string
  typeEnhanced: string
  enteredSystemTime: string
  activeTime: string
  jobDescription: string
  submitterJobName: string
  outputQueue: string
  dateFormat: string
  dateSeparator: string
  timeSeparator: string
  decimalFormat: string
  languageID: string
  countryID: string
  sortSequence: string
  ccsid: string
}

interface JobHistory {
  timestamp: string
  messageId: string
  severity: string
  texte: string
}

interface JobObjectLockInfo {
  object: string
  library: string
  objectType: string
  lockState: string
  lockStatus: string
  memberLocks: string
  asp: string
}

interface JobOpenFiles {
  libraryName: string
  fileName: string
  fileType: string
  memberName: string
  deviceName: string
  recordFormat: string
  activationGroupName: string
  activationGroupNumber: string
  openOption: string
  iaspName: string
  objectText: string
}

export class JobProperties extends Base {
  private jobPropertie: JobPropertie = {
    jobName: "",
    jobNameShort: "",
    jobUser: "",
    jobNumber: "",
    jobStatus: "",
    currentUser: "",
    typeEnhanced: "",
    enteredSystemTime: "",
    activeTime: "",
    jobDescription: "",
    submitterJobName: "",
    outputQueue: "",
    dateFormat: "",
    dateSeparator: "",
    timeSeparator: "",
    decimalFormat: "",
    languageID: "",
    countryID: "",
    sortSequence: "",
    ccsid: ""
  };

  private jobHistory: JobHistory[] | undefined;

  private jobObjectLockInfo: JobObjectLockInfo[] | undefined;
  private jobOpenFiles: JobOpenFiles[] | undefined;

  async fetch(): Promise<void> {

    const instance = getBase();
    const connection = instance.getConnection();
    const content = instance.getContent();
    if (connection && content) {

      // Job Properties
      const properties: Record<string, string | object | null>[] = (await vscode.commands.executeCommand(`code-for-ibmi.runQuery`, `SELECT IFNULL(x.job_name, '') "jobName", `
        + ` IFNULL(x.JOB_NAME_SHORT, '') "jobNameShort",`
        + ` IFNULL(x.JOB_USER, '') "jobUser",`
        + ` IFNULL(x.JOB_NUMBER, '') "jobNumber",`
        + ` IFNULL(x.job_status, '') "jobStatus",`
        + ` IFNULL(x.job_user, '') "currentUser",`
        + ` IFNULL(x.job_type_enhanced, '') "typeEnhanced",`
        + ` IFNULL(x.job_entered_system_time, '0001-01-01 00:00:00') "enteredSystemTime",`
        + ` IFNULL(x.job_active_time, '0001-01-01 00:00:00') "activeTime",`
        + ` x.job_description_library CONCAT '/' CONCAT x.job_description "jobDescription",`
        + ` IFNULL(x.submitter_job_name, '') "submitterJobName",`
        + ` x.output_queue_library concat '/' concat x.output_queue_name "outputQueue",`
        + ` ifnull(x.date_format, '') "dateFormat",`
        + ` ifnull(x.date_separator, '') "dateSeparator",`
        + ` ifnull(x.time_separator, '') "timeSeparator",`
        + ` ifnull(x.decimal_format, '') "decimalFormat",`
        + ` ifnull(x.language_id, '') "languageID",`
        + ` ifnull(x.country_id, '') "countryID",`
        + ` ifnull(x.sort_sequence_name, '') "sortSequence",`
        + ` x.ccsid "ccsid"`
        + ` FROM TABLE (QSYS2.JOB_INFO()) X`
        + ` where x.job_name = '${this.name}' LIMIT 1`));

      if (properties.length > 0) {
        const [propertie] = properties;
        this.jobPropertie.jobName = propertie.jobName!.toString();
        this.jobPropertie.jobNameShort = propertie.jobNameShort!.toString();
        this.jobPropertie.jobUser = propertie.jobUser!.toString();
        this.jobPropertie.jobNumber = propertie.jobNumber!.toString();
        this.jobPropertie.jobStatus = propertie.jobStatus!.toString();
        this.jobPropertie.currentUser = propertie.currentUser!.toString();
        this.jobPropertie.typeEnhanced = propertie.typeEnhanced!.toString();
        this.jobPropertie.enteredSystemTime = propertie.enteredSystemTime!.toString();
        this.jobPropertie.activeTime = propertie.activeTime!.toString();
        this.jobPropertie.jobDescription = propertie.jobDescription!.toString();
        this.jobPropertie.submitterJobName = propertie.submitterJobName!.toString();
        this.jobPropertie.outputQueue = propertie.outputQueue!.toString();
        this.jobPropertie.dateFormat = propertie.dateFormat!.toString();
        this.jobPropertie.dateSeparator = propertie.dateSeparator!.toString();
        this.jobPropertie.timeSeparator = propertie.timeSeparator!.toString();
        this.jobPropertie.decimalFormat = propertie.decimalFormat!.toString();
        this.jobPropertie.languageID = propertie.languageID!.toString();
        this.jobPropertie.countryID = propertie.countryID!.toString();
        this.jobPropertie.sortSequence = propertie.sortSequence!.toString();
        this.jobPropertie.ccsid = propertie.ccsid!.toString();
      }

      // History Job
      this.jobHistory = await <JobHistory[]>content.runSQL([`select message_timestamp "timestamp", ifnull(message_id, '') "messageId", severity "severity", trim(message_text) "texte" from table(qsys2.joblog_info('${this.name}')) a order by ordinal_position desc`].join(` `));

      // Lock info
      this.jobObjectLockInfo = await <JobObjectLockInfo[]>content.runSQL([`SELECT DISTINCT object_name "object",
            object_library "library",
            object_type "objectType",
            lock_state "lockState",
            lock_status "lockStatus",
            case when (IFNULL(MEMBER_LOCKS, 0) > 0) then 'YES' else 'NO' end "memberLocks",
            asp_name "asp"
      FROM TABLE (qsys2.job_lock_info(job_name => '${this.name}'))
      ORDER BY object_name, object_library, object_type`].join(` `));

      this.jobOpenFiles = await <JobOpenFiles[]>content.runSQL([`SELECT LIBRARY_NAME "libraryName",
      FILE_NAME "fileName",
      FILE_TYPE "fileType",
      IFNULL(MEMBER_NAME, '') "memberName",
      IFNULL(DEVICE_NAME, '') "deviceName",
      IFNULL(RECORD_FORMAT, '') "recordFormat",
      ACTIVATION_GROUP_NAME "activationGroupName",
      ACTIVATION_GROUP_NUMBER "activationGroupNumber",
      OPEN_OPTION "openOption",
      IASP_NAME "iaspName",
      (SELECT objtext
          FROM TABLE (
              QSYS2.OBJECT_STATISTICS(
                LIBRARY_NAME, '*ALL', OBJECT_NAME => FILE_NAME)
            ) A) "objectText"
      FROM TABLE (
          QSYS2.OPEN_FILES('${this.name}')
        ) a`].join(` `));


    } else {
      throw new Error("No connection.");
    }
  }

  generateHTML(): string {
    const info = this.jobPropertie!;

    const propertieTab = `<h1>Job properties</h1><h2><i>${this.name}</i></h2>
      <vscode-data-grid>
        <vscode-data-grid-row row-type="header">
          <vscode-data-grid-cell cell-type="columnheader" grid-column="1"></vscode-data-grid-cell>
          <vscode-data-grid-cell cell-type="columnheader" grid-column="2"></vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Status</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.jobStatus}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Job name</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.jobNameShort}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Type enhanced</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.typeEnhanced}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Entered in the system</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.enteredSystemTime}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Active time</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.activeTime}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Job description</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.jobDescription}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Submitter job name</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.submitterJobName}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Output queue</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.outputQueue}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Date format</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.dateFormat}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Date separator</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.dateSeparator}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Time separator</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.timeSeparator}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Decimal format</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.decimalFormat}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Language ID</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.languageID}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Country ID</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.countryID}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">Sort sequence</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.sortSequence}</vscode-data-grid-cell>
        </vscode-data-grid-row>
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">CCSID</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${info?.ccsid}</vscode-data-grid-cell>
        </vscode-data-grid-row>
      </vscode-data-grid>
      `;

    const historyTab = `<h1>Display job log</h1><h2><i>${this.name}</i></h2>
      <vscode-data-grid>
      <vscode-data-grid-row row-type="header">
        <vscode-data-grid-cell cell-type="columnheader" grid-column="1"><b>Timestamp</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="2"><b>Message ID</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="3"><b>Severity</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="4"><b>Description</b></vscode-data-grid-cell>
      </vscode-data-grid-row>
      ${this.jobHistory?.map(history => {
        return /*html*/`
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">${history.timestamp}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${history.messageId}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="3">${history.severity}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="4">${history.texte}</vscode-data-grid-cell>
        </vscode-data-grid-row>`;
      }).join("")}
      </vscode-data-grid>
      `;

    const objectsLockTab = `<h1>Objects lock</h1><h2><i>${this.name}</i></h2>
      <vscode-data-grid>
      <vscode-data-grid-row row-type="header">
        <vscode-data-grid-cell cell-type="columnheader" grid-column="1"><b>Object</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="2"><b>Library</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="3"><b>Object type</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="4"><b>Lock state</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="5"><b>Lock status</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="6"><b>Member locks ?</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="7"><b>ASP</b></vscode-data-grid-cell>
      </vscode-data-grid-row>
      ${this.jobObjectLockInfo?.map(objectLock => {
        return /*html*/`
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">${objectLock.object}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${objectLock.library}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="3">${objectLock.objectType}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="4">${objectLock.lockState}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="5">${objectLock.lockStatus}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="6">${objectLock.memberLocks}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="7">${objectLock.asp}</vscode-data-grid-cell>
        </vscode-data-grid-row>`;
      }).join("")}
      </vscode-data-grid>
      `;

    const openFilesTab = `<h1>Objects lock</h1><h2><i>${this.name}</i></h2>
      <vscode-data-grid>
      <vscode-data-grid-row row-type="header">
        <vscode-data-grid-cell cell-type="columnheader" grid-column="1"><b>Library</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="2"><b>File name</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="3"><b>File type</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="4"><b>Text</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="5"><b>Member</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="6"><b>Device</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="7"><b>Record format</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="8"><b>Act. group name</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="9"><b>Act. group n°</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="10"><b>Open option</b></vscode-data-grid-cell>
        <vscode-data-grid-cell cell-type="columnheader" grid-column="11"><b>ASP</b></vscode-data-grid-cell>
      </vscode-data-grid-row>
      ${this.jobOpenFiles?.map(openFile => {
        return /*html*/`
        <vscode-data-grid-row>
          <vscode-data-grid-cell grid-column="1">${openFile.libraryName}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="2">${openFile.fileName}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="3">${openFile.fileType}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="4">${openFile.objectText}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="5">${openFile.memberName}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="6">${openFile.deviceName}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="7">${openFile.recordFormat}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="8">${openFile.activationGroupName}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="9">${openFile.activationGroupNumber}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="10">${openFile.openOption}</vscode-data-grid-cell>
          <vscode-data-grid-cell grid-column="11">${openFile.iaspName}</vscode-data-grid-cell>
        </vscode-data-grid-row>`;
      }).join("")}
      </vscode-data-grid>
      `;

      const panels = /*html*/`
      <vscode-panels>
        <vscode-panel-tab id="tab-1">
          PROPERTIES
        </vscode-panel-tab>
        <vscode-panel-tab id="tab-2">
          HISTORY
          <vscode-badge appearance="secondary">${this.jobHistory?.length}</vscode-badge>
        </vscode-panel-tab>
        <vscode-panel-tab id="tab-3">
          LOCK INFO
          <vscode-badge appearance="secondary">${this.jobObjectLockInfo?.length}</vscode-badge>
        </vscode-panel-tab>
        <vscode-panel-tab id="tab-4">
          OPEN FILES
          <vscode-badge appearance="secondary">${this.jobOpenFiles?.length}</vscode-badge>
        </vscode-panel-tab>
        <vscode-panel-view id="view-1">${propertieTab}</vscode-panel-view>
        <vscode-panel-view id="view-2">${historyTab}</vscode-panel-view>
        <vscode-panel-view id="view-3">${objectsLockTab}</vscode-panel-view>
        <vscode-panel-view id="view-4">${openFilesTab}</vscode-panel-view>
      </vscode-panels>`; 

    return panels;
  }

  // We do the same action when use the button or Save document
  handleAction(data: any): HandleActionResult {
    // Nothing to do
    return {
      dirty: true
    };

  }

  async save(): Promise<void> {
    // Nothing to do
  }

}
