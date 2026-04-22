import { Show } from "solid-js";
import type { IconPack } from "../../../components/AppIcon";
import { formatDate, formatSize } from "../../../utils/formatters";
import type { FileItem } from "../../../utils/mockData";
import { FileIcon } from "./FileBrowser/FileIcon";

export interface PromptConfig {
	title: string;
	defaultValue?: string;
	onSubmit: (val: string) => void;
}

export interface InfoModal {
	file: FileItem;
}

interface ExplorerModalsProps {
	infoModal: InfoModal | null;
	setInfoModal: (val: InfoModal | null) => void;
	promptConfig: PromptConfig | null;
	setPromptConfig: (val: PromptConfig | null) => void;
	iconPack: IconPack;
}

export function ExplorerModals(props: ExplorerModalsProps) {
	return (
    <>
      <Show when={props.infoModal}>
        <div
          class="modal-overlay"
          onClick={() => props.setInfoModal(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              props.setInfoModal(null);
            }
          }}
          role="button"
          aria-label="Close modal"
          tabIndex={-1}
        >
          <div
            class="modal-content info-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div class="info-header">
              <FileIcon
                type={props.infoModal?.file.type}
                name={props.infoModal?.file.name}
                pack={props.iconPack}
                size={56}
              />
              <h3 class="info-title">{props.infoModal?.file.name}</h3>
            </div>
            <div class="info-body">
              <div class="info-row">
                <span class="info-label">Kind</span>
                <span class="info-value">
                  {props.infoModal?.file.type === "folder"
                    ? "Folder"
                    : `${props.infoModal?.file.name.includes(".")
                      ? props.infoModal?.file.name
                        .split(".")
                        .pop()
                        ?.toUpperCase()
                      : "--"
                      } Document`}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Size</span>
                <span class="info-value">
                  {props.infoModal?.file.type === "folder"
                    ? "--"
                    : formatSize(props.infoModal?.file.size)}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Where</span>
                <span
                  class="info-value path-value"
                  title={props.infoModal?.file.id}
                >
                  {props.infoModal?.file.id}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Modified</span>
                <span class="info-value">
                  {formatDate(props.infoModal?.file.updatedAt)}
                </span>
              </div>
            </div>
            <div class="modal-actions">
              <button
                type="button"
                class="ok-btn"
                onClick={() => props.setInfoModal(null)}
              >
                Close Info
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={props.promptConfig}>
        <div
          class="modal-overlay"
          onClick={() => props.setPromptConfig(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              props.setPromptConfig(null);
            }
          }}
          role="button"
          aria-label="Close modal"
          tabIndex={-1}
        >
          <div
            class="modal-content"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <h3>{props.promptConfig?.title}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = new FormData(e.currentTarget).get(
                  "promptInput",
                ) as string;
                if (input?.trim()) {
                  props.promptConfig?.onSubmit(input.trim());
                }
                props.setPromptConfig(null);
              }}
            >
              <input
                name="promptInput"
                type="text"
                autofocus
                value={props.promptConfig?.defaultValue || ""}
                class="modal-input"
              />
              <div class="modal-actions">
                <button
                  type="button"
                  class="cancel-btn"
                  onClick={() => props.setPromptConfig(null)}
                >
                  Cancel
                </button>
                <button type="submit" class="ok-btn">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </>
  );
}
