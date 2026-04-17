export const OPEN_PROPOSAL_MEETING_EDITOR_EVENT =
  "meetingaudit:open-proposal-meeting-editor"

export function dispatchOpenProposalMeetingEditorEvent() {
  window.dispatchEvent(new CustomEvent(OPEN_PROPOSAL_MEETING_EDITOR_EVENT))
}
