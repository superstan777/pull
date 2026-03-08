export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin">
        <div className="h-12 w-12 border-4 border-muted border-t-primary rounded-full" />
      </div>
    </div>
  );
}
