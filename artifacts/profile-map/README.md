# Local profile, sound and map verification

Screenshots show an explicitly labeled local fixture with mocked Google map, synthetic rentals and mocked account APIs. No production account, actual inventory or live Google authorization is represented. The temporary QA route was removed before build.

Browser checks passed: saved pin popups and rental links, destination selection and distance ordering, profile photo upload/crop/resize/save, no sound for initial history, sound for new unread notification, persistent mute behavior, no phone horizontal overflow and no runtime errors. Google Maps and audio playback were instrumented; the uploaded MP3 was copied unchanged. Physical speaker/device playback and live browser key authorization were not verified.

Unit tests cover role-specific guides/profile shortcuts, bounded image types, account-scoped same-origin photo writes, initial/new/read notice distinctions and additive migration data preservation.
