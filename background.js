// default suggestion always appears first when the user is interacting with the extension; this can't be selected
browser.omnibox.setDefaultSuggestion({
  description: `Search for containers and switch to them (e.g. "-co personal" or "-co default")`
})

// when user types a new character etc.
browser.omnibox.onInputChanged.addListener(async (text, addSuggestions) => {
  // get all containers
  const contexts = await browser.contextualIdentities.query({})
  // add the default/no container
  contexts.push({
    name: "default"
  })
  
  // array for suggestions to show
  const result = []
  // TODO: use '-' as an alias to the default/no container
  // if typed expression is contained in a name of a container, suggest the container
  for (let context of contexts) {
    // if (context.name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
    if (context.name.fuzzy(text)) {
      result.push({
        content: context.name,
        description: `Switch to container: ${context.name}`
      })
    }
  }

  addSuggestions(result)
})

// when user submits the input, selects an extension suggestion
browser.omnibox.onInputEntered.addListener(async (text, disposition) => {
  // get all containers
  const contexts = await browser.contextualIdentities.query({})
  // add the default/no container
  contexts.push({
    cookieStoreId: 'firefox-default',
    name: "default"
  })
  
  // get tabs or only the active tab?
  const tabs = await browser.tabs.query({ currentWindow: true, active: true })

  // reopen tab in a new container (first suggestion)
  for (let context of contexts) {
    // TODO: use '-' as an alias to the default/no container
    // if (context.name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
    if (context.name.fuzzy(text)) {
      let tabCreateProperties = {
        cookieStoreId: context.cookieStoreId,
        index: tabs[0].index
      }
      if(tabs[0].url !== 'about:newtab' && tabs[0].url !== 'about:blank') {
        tabCreateProperties.url = tabs[0].url
      }
      browser.tabs.create(tabCreateProperties)
      browser.tabs.remove(tabs[0].id)
      break
    }
  }
})

// fuzzy match for strings - chars in the same order as in haystack?
// "hello".fuzzy("eo") -> true
// thanks to Dziad Borowy: https://stackoverflow.com/a/15252131
String.prototype.fuzzy = function (str) {
  let hay = this.toLowerCase()
  str = str.toLowerCase()
  let pos = -1
  for (let char of str) {
    pos = hay.indexOf(char, pos + 1)
    if (pos == -1) {
      return false
    }
  }
  return pos != -1;
};