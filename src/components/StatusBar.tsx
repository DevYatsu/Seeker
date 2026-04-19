type StatusBarProps = {
  itemCount: number;
  selectionCount: number;
};

export default function StatusBar(props: StatusBarProps) {
  return (
    <footer class="status-bar">
      <div class="status-left">
        <span class="status-item">{props.itemCount} items</span>
        {props.selectionCount > 0 && (
          <span class="status-item selection">
            {props.selectionCount}{" "}
            {props.selectionCount === 1 ? "item" : "items"} selected
          </span>
        )}
      </div>

      <div class="status-right">
        <div class="storage-info">
          <div class="storage-label">124.5 GB free</div>
          <div class="storage-meter">
            <div class="storage-fill" style="width: 65%;"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
