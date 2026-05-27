#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use napi::*;
use std::fs;
use std::path::Path;
use std::path::PathBuf;


#[napi]
#[allow(dead_code)]
fn delete_folder_recursive(item_path: String) -> Result<()> {
    let absolute_path = match std::fs::canonicalize(&item_path) {
        Ok(path) => path,
        Err(_) => {
            println!("Warning: The path does not exist, nothing has been removed.");
            return Ok(());
        }
    };
    if !absolute_path.is_dir() {
        return Err(Error::new(
            Status::InvalidArg,
            "The path is not a directory",
        ));
    }
    fs::remove_dir_all(absolute_path)?;

    Ok(())
}

fn _copy_folder_recursive(source_path: &PathBuf, target_path: &PathBuf) -> Result<()> {
    let source = Path::new(&source_path);

    fs::create_dir_all(&target_path)?;

    let entries = fs::read_dir(source)?;

    for entry in entries {
        let entry = entry?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            _copy_folder_recursive(&entry_path, &target_path.join(entry.file_name()))?;
        } else {
            let target_file_path = target_path.join(&entry.file_name());
            
            fs::copy(&entry_path, &target_file_path)?;
        }
    }

    Ok(())
}
#[napi]
#[allow(dead_code)]
fn copy_folder_recursive(source_path: String, target_path: String) -> Result<()> {
    let source = match std::fs::canonicalize(&source_path) {
        Ok(path) => path,
        Err(_) => {
            return Err(Error::new
                (Status::InvalidArg, "Source path does not exist"),
            );
        }
    };
    let target = {
        std::fs::create_dir_all(&target_path).unwrap();
        std::fs::canonicalize(&target_path).unwrap()
    };


    _copy_folder_recursive(&source, &target)
}