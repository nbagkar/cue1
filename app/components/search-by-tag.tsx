  <div className="mt-4">
    {isLoading ? (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    ) : errorMessage ? (
      <div className="flex items-center justify-center h-32 text-center">
        <p className="text-red-500">{errorMessage}</p>
      </div>
    ) : searchResults.length === 0 ? (
      <div className="flex items-center justify-center h-32 text-center">
        <p className="text-gray-500">No sounds found matching your search criteria</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {searchResults.map((sound) => (
          <SoundCard
            key={sound.id}
            sound={sound}
            showActions={true}
            onEdit={() => handleEditMode(true, sound)}
            addToastNotification={(message) => console.log("TODO: toast notification", message)}
          />
        ))}
      </div>
    )}
  </div> 