$lockedFile = "D:\Edmin\server\node_modules\.prisma\client\query_engine-windows.dll.node"
# Try to rename it, if it fails, it's locked.
Rename-Item $lockedFile "query_engine-windows.dll.node.bak" -ErrorAction SilentlyContinue
