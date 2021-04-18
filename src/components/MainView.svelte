<main class="flex flex-col md:flex-row md:max-h-screen">
  <div class="flex flex-col min-w-sm">
    <div
      class="show-scrollbar overflow-y-auto text-primary-50 h-full bg-secondary-500 md:w-64 lg:w-72 p-2 md:p-5 xl:p-10"
    >
      <slot name="sidetop" />
    </div>
    <div class="bg-primary-900 h-1/3">
      <slot name="sidebottom" />
    </div>
  </div>
  <div class="bg-secondary-900 border-l-2 border-primary-200 flex-grow">
    <slot name="root" />
    <div>
      <slot name="controls" />
    </div>
  </div>
</main>
