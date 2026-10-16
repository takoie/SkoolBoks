; Custom NSIS hooks for SkoolBoks.
; Injected into the Tauri-generated installer/uninstaller via
; bundle.windows.nsis.installerHooks in tauri.conf.json.
;
; Goal: no ghost files across updates/uninstalls. Every version of the app
; may add/remove/rename files (icons, sidecars, etc.), so we wipe $INSTDIR
; before laying down new files, and wipe it again (plus registry leftovers)
; when the app is removed.

!macro NSIS_HOOK_PREINSTALL
  ; Remove the previous install's files before the new version is copied in,
  ; so renamed/removed files from older releases don't linger.
  RMDir /r "$INSTDIR"
!macroend

!macro NSIS_HOOK_POSTINSTALL
!macroend

!macro NSIS_HOOK_PREUNINSTALL
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Belt-and-braces: remove anything left behind in the install directory
  ; (e.g. files the app itself wrote next to the binary) and any stray
  ; Start Menu / registry entries the default uninstaller step might miss.
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\SkoolBoks"
  DeleteRegKey /ifempty HKCU "Software\SkoolBoks"
!macroend
