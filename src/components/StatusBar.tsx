type StatusBarProps = {
  itemCount: number;
  hasSelection: boolean;
};

export default function StatusBar(props: StatusBarProps) {
  return (
    <footer class="status-bar">
      <span class="status-info">
        {props.itemCount} items • 
        {props.hasSelection ? ` 1 item selected` : ''}
      </span>
    </footer>
  );
}
