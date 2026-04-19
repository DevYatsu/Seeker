type StatusBarProps = {
  itemCount: number;
  selectionCount: number;
};

export default function StatusBar(props: StatusBarProps) {
  return (
    <footer class="status-bar">
      <span class="status-left">
        {props.itemCount} items
        {props.selectionCount > 0 && (
          <>
            <span class="status-separator">|</span>
            <span class="selection-info">
              {props.selectionCount} {props.selectionCount === 1 ? 'item' : 'items'} selected
            </span>
          </>
        )}
      </span>
      <span class="status-right">
        42.5 GB available
      </span>
    </footer>
  );
}
